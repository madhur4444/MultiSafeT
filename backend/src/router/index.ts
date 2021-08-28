import express from "express";
import axios from "axios";
import {checkAddressChecksum} from 'ethereum-checksum-address';
import { setVaultDataRedis, getVaultDataRedis } from "./redis";


export default function router(app: express.Application): void {
  app.route("/").get((req: express.Request, res: express.Response) => {
    res.send("Started");
  });

  app.get(
    "/getBalance",
    async (req: express.Request, res: express.Response) => {
      // send addrs as array in req.body
      const recvAddrs: Array<string> = req.body.addrs;
      const addrs: Array<string> = [];
      // Create array of valid eth addresses
      for(let addr of recvAddrs){
        if(checkAddressChecksum(addr)){
          addrs.push(addr);
        } else {
          console.log("Invalid address: " + addr);
        }
      }
      // Set up structures for return balance data, could later setup proper Types for balance_data, skipping for now
      let promises: Array<Promise<any>> = [];
      let balance_data: Array<<JSON>() => any> = [];

      try {

        for (let addr of addrs) {
          let balData = await getVaultDataRedis(addr);
          if (balData) {
            balance_data.push(balData);
          } else {
            // console.log("adding to cache")
            const prom: Promise<any> = axios
              .get(
                `https://safe-transaction.gnosis.io/api/v1/safes/${addr}/balances/usd/`
              )
              .then((res) => {
                // set expiry to an hour
                // Assumption: Vault balances won't change often considering txs happen only once or twice for multisig vaults
                setVaultDataRedis(addr, res.data);
                balance_data.push(res.data);
              });
            // Put all reqs together so we can run concurrently
            promises.push(prom);
          }
        }

        // Resolve all promises if added
        await Promise.all(promises).catch((err) => {
          console.log(err);
        });

        // Return success if everything happens smoothly
        if(balance_data){
          res.status(200).json(balance_data);
        } else {
          res.status(404);
        }
      } catch (error) {
        res.send(500).send({
          message: "Server error",
        });
        console.log(error);
      }
    }
  );
}
