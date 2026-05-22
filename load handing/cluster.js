const cluster = require('cluster');
const os      = require('os');
const app     = require('./src/app');
require('dotenv').config();

const PORT     = process.env.PORT || 3000;
const CPU_COUNT = os.cpus().length;

if (cluster.isPrimary) {
  console.log(`🚀 Primary ${process.pid} — ${CPU_COUNT} CPUs detected`);

  for (let i = 0; i < CPU_COUNT; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code) => {
    console.log(`💀 Worker ${worker.process.pid} died (code: ${code})`);
    console.log('♻️  Naya worker bana raha hoon...');
    cluster.fork(); // ← Production mein MUST hai
  });

  cluster.on('online', (worker) => {
    console.log(`✅ Worker ${worker.process.pid} online`);
  });

} else {
  // Har worker apna server run karega
  app.listen(PORT, () => {
    console.log(`👷 Worker ${process.pid} listening on port ${PORT}`);
  });
}