// A utility to mimic sleep

 async function pause (duration = Math.round(Math.random() * 15 + 25)) {
   return new Promise((resolve, reject) => {
     window.setTimeout(resolve, duration)
   })
 }

 export default pause
