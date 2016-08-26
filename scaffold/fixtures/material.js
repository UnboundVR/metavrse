import r from 'rethinkdb';
import materials from '../data/materials.json';

export default async function(conn, ownerUserId) {
  let count = 1;
  for(let material of materials) {
    let materialObj = {
      id: count++,
      textures: material,
      owner: ownerUserId
    };
    await r.db('metavrse').table('material').insert(materialObj).run(conn);
  }

  console.log(`Loaded ${materials.length} materials into the db`);

  return materials.length;
}