
const knex = require('knex');
const app = require('../src/app');
const { makeFoldersArray, makeNotesArray } = require('./noteful-fixtures');

describe('Noteful endpoints', function () {
  let db;
  before('make knex intance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DATABASE_URL
    });
    app.set('db', db);
  });

  after('disconnect from db', () => db.destroy());
  before('clean up table', () => db.raw('TRUNCATE folders, notes RESTART IDENTITY CASCADE'));
  afterEach('cleanup', () => db.raw('TRUNCATE folders, notes RESTART IDENTITY CASCADE'));



  describe('GET /folders', () => {
    context('Given no folders', () => {
      it('responds with 200 and an empty list', () => {
        return supertest(app)
          .get('/api/folders')
          .expect(200, []);
      });
    });

    context('Given there are folders in the database', () => {
      const testFolders = makeFoldersArray();
      beforeEach('insert folders data', () => {
        return db
          .insert(testFolders)
          .into('folders');
      });
      it('GET /folders responds with 200 and all the folders', () => {
        return supertest(app)
          .get('/api/folders')
          .expect(200, testFolders);
      });
    });
    //End of describeGET ENDPOINTS
  });

  describe('POST /folders', () => {
    context('given no folders present', () => {
      it('returns a 201 status and the new folder', () => {
        const newFolder = {
          name: 'Newest Folder'
        };
        return supertest(app)
          .post('/api/folders')
          .send(newFolder)
          .expect(201)
          .expect(res => {
            const expectedResult = {
              ...newFolder,
              id: res.body.id
            };
            return expect(res.body).to.eql(expectedResult);
          })
      });
      it('returns 400 error when no name is supplied for folder', () => {
        return supertest(app)
          .post('/api/folders')
          .expect(400, { error: { message: `Missing 'name' in request body` } });
      });
    });
    //END of describe POST endpoints  
  });

  describe('Route /:folderId', () => {
    context('given no folders in database', () => {
      it('returns an error', () => {
        return supertest(app)
          .get('/api/folders/123456')
          .expect(404, { error: { message: 'folder does not exist' } });
      });
    })
    context('Given there are folders present', () => {
      const testFolders = makeFoldersArray();
      beforeEach('insert folders data', () => {
        return db
          .insert(testFolders)
          .into('folders');
      });
      it('GET /:folderId returns the correct folder', () => {
        const testId = 2;
        const expectedFolder = testFolders[testId - 1];

        return supertest(app)
          .get(`/api/folders/${testId}`)
          .expect(200, expectedFolder);
      })

      it('Delete /:folderId deletes the correct folder', () => {
        const testId = 2;
        const expectedResults = testFolders.filter(folder => folder.id !== testId);

        return supertest(app)
          .delete(`/api/folders/${testId}`)
          .expect(204)
          .then(() => {
            return supertest(app)
              .get('/api/folders')
              .expect(200, expectedResults);
          })
      })

      it('PATCH edits folder name', () => {
        const testId = 2;
        const updateName = {
          name: 'Updated the name'
        }
        return supertest(app)
          .patch(`/api/folders/${testId}`)
          .send(updateName)
          .expect(204)
          .then(() => {
            return supertest(app)
              .get(`/api/folders/${testId}`)
              .expect({ id: testId, name: updateName.name });
          })
      })
    })
  })

  describe('/Notes endpoints', () => {
    context('given no notes', () => {
      it('/GET returns 200 and an empty array given no notes', () => {
        return supertest(app)
          .get('/api/notes')
          .expect(200, []);
      })
    })
    context('given notes in the database', () => {
      const testFolders = makeFoldersArray();
      const testNotes = makeNotesArray();
      beforeEach('insert data', () => {
        return db
          .into('folders')
          .insert(testFolders)
          .then(() => {
            return db
              .into('notes')
              .insert(testNotes)
          });
      });

      it('returns 200 and all the notes', () => {
        this.retries(3);
        return supertest(app)
          .get('/api/notes')
          .expect(200, testNotes)
      })

      it('/POST creates a new note', () => {
        const testNote = {
          'id': 5,
          'name': 'Test Note',
          'date_modified': '2019-01-03T00:00:00.000Z',
          'folder_id': 1,
          'content': 'test note'
        }
        return supertest(app)
          .post('/api/notes')
          .send(testNote)
          .expect(201, testNote)
      })

      it('returns an error when trying to get note that does not exist', () => {
        return supertest(app)
          .get('/api/notes/123456')
          .expect(404, { error: { message: 'Note does not exist' } })
      })

      it('returns correct note by id', () => {
        const testNoteId = 2;
        const expectedResult = testNotes[testNoteId -1];
        return supertest(app)
          .get(`/api/notes/${testNoteId}`)
          .expect(200, expectedResult)
      })

      it('deletes note by id', () => {
        const testNoteId = 2;
        const expectedResult = testNotes.filter(notes => notes.id !== testNoteId);
        return supertest(app)
          .delete(`/api/notes/${testNoteId}`)
          .expect(204)
          .then(() => {
            return supertest(app)
            .get('/api/notes')
            .expect(200, expectedResult);
          })
      })

      it('updates a note by id', () => {
        const updatedNote = {
          name: 'Updating Note',
          content: 'changing the content'
        }
        const noteIdToUpdate = 1;

        return supertest(app)
          .patch(`/api/notes/${noteIdToUpdate}`)
          .send(updatedNote)
          .expect(200)
          .then(() => {
            return supertest(app)
              .get(`/api/notes/${noteIdToUpdate}`)
              .expect(200, {
                ...testNotes[noteIdToUpdate-1],
                ...updatedNote
              })
          })
      })


    });

  });



  //END of Describe ALL noteful endpoints
});