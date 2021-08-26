import express from 'express'
import axios from 'axios'
import { createClient } from 'redis';
import { promisify } from 'util';


const redis_client = createClient({ url: 'redis://redis:6379' });

redis_client.on("error", (err) => {
  console.log(err);
});

export default function router(app: express.Application): void {
  app.route("/").get((req: express.Request, res: express.Response) => {
    res.send("Started");
  });
  
  app.get('/getBalance/:id', async (req:  express.Request, res: express.Response) => {
    
    // send addrs as array in req.body
    const addrs = req.body.addrs
    let promises = [];

    try {
        addrs.forEach(async (addr) => {
        const getAsync = promisify(redis_client.hget).bind(redis_client);
        const hkey = Buffer.from(`${addr}`).toString("base64");
        const balData = await getAsync(hkey, addr);
        if(balData){
          console.log(balData)
        } else{
          const prom = axios.get(`https://safe-transaction.gnosis.io/api/v1/safes/${addr}/balances/usd/`)
            .then((res) => {
              // set expiry to an hour
              redis_client.hset(hkey,addr, JSON.stringify(res.data))
              redis_client.expire(hkey, 60*60)
            })
            // Put all reqs together so we can run concurrently 
          promises.push(prom);
        }
      });
      
      // Resolve all promises if added
      Promise.all(promises)
      .then( () => {
      })
      .catch(console.error);

      // Return success if everything happens smoothly
      res
      .status(200)
      .send({
        message: "Successfully Queried"
      })
    } catch (error) {
     console.log(error);
  }
});
}