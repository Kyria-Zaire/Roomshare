// Script MongoDB : passer un utilisateur en owner
// Usage: docker exec roomshare-mongodb mongosh roomshare --quiet < scripts/set-user-owner.js
// Ou avec l'email en variable (à adapter dans la commande)

const email = 'kyriamambu1@gmail.com';
const result = db.users.updateOne(
  { email: email },
  { $set: { role: 'owner' } }
);
print('Modified count:', result.modifiedCount);
print('Matched count:', result.matchedCount);
