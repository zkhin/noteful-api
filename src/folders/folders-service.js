
const FoldersService = {
  getAllFolders(knex) {
    return knex
      .select('*')
      .from('folders');
  },

  insertFolder(knex, folderData) {
    return knex
      .insert(folderData)
      .into('folders')
      .returning('*')
      .then(rows => {
        return rows[0];
      });
  },

  getById(knex, id) {
    return knex('folders')
      .select('*')
      .where({ id })
      .first();
  },

  deleteFolder(knex, id) {
    return knex('folders')
      .where({id})
      .delete();
  },

  updateFolder(knex, id, updatedFolderData) {
    return knex('folders')
      .where({ id })
      .update(updatedFolderData);
  },
};

module.exports = FoldersService;

