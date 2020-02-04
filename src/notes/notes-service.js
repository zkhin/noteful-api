const NotesService = {

  getAllNotes(knex) {
    return knex('notes')
      .select('*');
  },

  insertNote(knex, noteData) {
    return knex
      .into('notes')
      .insert(noteData)
      .returning('*')
      .then(rows => {
        return rows[0];
      });
  },

  getNoteById(knex, id) {
    return knex('notes')
      .select('*')
      .where({ id })
      .first();
  },

  deleteNote(knex, id) {
    return knex('notes')
      .where({id})
      .delete();
  },

  updateNote(knex, id, updatedNote) {
    return knex('notes')
      .where({id})
      .update(updatedNote)
      .returning('*')
      .then(rows => {
        return rows[0];
      });

  },

};


module.exports = NotesService;