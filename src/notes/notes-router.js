const express = require('express');
const NotesService = require('./notes-service');
const xss = require('xss');
const path = require('path');

const notesRouter = express.Router();
const jsonParser = express.json();

const serializeNote = notes => {
  return {
    id: notes.id,
    name: xss(notes.name),
    date_modified: notes.date_modified,
    folder_id: notes.folder_id,
    content: xss(notes.content)
  };
};

notesRouter
  .route('/')
  .get((req, res, next) => {
    const knexInstance = req.app.get('db');

    NotesService.getAllNotes(knexInstance)
      .then(notes => {
        return res.status(200).json(notes.map(serializeNote));
      })
      .catch(next);
  })
  .post(jsonParser, (req, res, next) => {
    const knexInstance = req.app.get('db');
    const { id, name, date_modified, folder_id, content } = req.body;
    const newNote = { name, folder_id, content };

    for (const [key, value] of Object.entries(newNote)) {
      if (!value) {
        return res.status(400).json({ error: { message: `New note must include name, folder_id, and content.  Missing ${key} in request body` } });
      }
    }

    newNote.id = id;
    newNote.date_modified = date_modified;

    NotesService.insertNote(knexInstance, newNote)
      .then(note => {
        return res.status(201)
          .location(path.posix.join(req.originalUrl, `/${newNote.id}`))
          .json(serializeNote(note));
      })
      .catch(next);
  });

notesRouter
  .route('/:note_id')
  .all((req, res, next) => {
    const knexInstance = req.app.get('db');
    const noteId = req.params.note_id;

    NotesService.getNoteById(knexInstance, noteId)
      .then((note) => {
        if (!note) {
          return res.status(404).json({ error: { message: 'Note does not exist' } });
        }
        res.note = note;
        next();
      })
      .catch(next);
  })
  .get((req, res, next) => {
    return res.json(serializeNote(res.note));
  })
  .delete((req, res, next) => {
    const knexInstance = req.app.get('db');
    const noteId = req.params.note_id;

    NotesService.deleteNote(knexInstance, noteId)
      .then(() => {
        return res.status(204).end();
      })
      .catch(next);
  })
  .patch(jsonParser, (req, res, next) => {
    const knexInstance = req.app.get('db');
    const noteId = req.params.note_id;
    const { name, date_modified, folder_id, content } = req.body;
    const updatedNote = { name, date_modified, folder_id, content };

    const valuesToUpdate = Object.values(updatedNote).filter(Boolean).length;
    if (valuesToUpdate === 0) {
      return res.status(400).json({ error: { message: 'To update note please include name, date_modified, folder_id, or content.' } });
    }
    NotesService.updateNote(knexInstance, noteId, updatedNote)
      .then((note) => {
        return res.status(200).json(serializeNote(note));
      })
      .catch(next);
  });

module.exports = notesRouter;

