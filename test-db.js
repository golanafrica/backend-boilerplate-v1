
const { Client } = require('pg');

const client = new Client({
  host: '127.0.0.1',
  port: 5432,
  user: 'postgres',
  database: 'boilerplate',
  password: '',  // Pas de mot de passe en mode trust
});

client.connect()
  .then(() => {
    console.log('✅ Connexion réussie !');
    return client.query('SELECT version();');
  })
  .then(res => {
    console.log('Version PostgreSQL:', res.rows[0].version);
    client.end();
  })
  .catch(err => {
    console.error('❌ Erreur de connexion:', err.message);
    client.end();
  });
