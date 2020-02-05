const express = require("express");
const FoldersService = require("./folders-service");
const xss = require("xss");
const path = require("path");

const foldersRouter = express.Router();
const jsonParser = express.json();

const serializeFolder = folders => {
  return {
    id: folders.id,
    name: xss(folders.name)
  };
};

foldersRouter
  .route("/")
  .get(async (req, res, next) => {
    const knexInstance = req.app.get("db");
    try {
      await FoldersService.getAllFolders(knexInstance).then(folders => {
        return res.status(200).json(folders.map(serializeFolder));
      });
    } catch (error) {
      next(error);
    }
  })
  .post(jsonParser, (req, res, next) => {
    const knexInstance = req.app.get("db");
    const { name } = req.body;
    const newFolder = { name: xss(name) };

    for (const [key, value] of Object.entries(newFolder)) {
      if (!value) {
        return res
          .status(400)
          .json({ error: { message: `Missing '${key}' in request body` } });
      }
    }

    FoldersService.insertFolder(knexInstance, newFolder)
      .then(folder => {
        return res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${folder.id}`))
          .json(serializeFolder(folder));
      })
      .catch(next);
  });

foldersRouter
  .route("/:folderId")
  .all((req, res, next) => {
    const knexInstance = req.app.get("db");
    const folderId = req.params.folderId;
    FoldersService.getById(knexInstance, folderId)
      .then(folder => {
        if (!folder) {
          return res
            .status(404)
            .json({ error: { message: "folder does not exist" } });
        }
        res.folder = folder;
        next();
      })
      .catch(next);
  })
  .get((req, res, next) => {
    return res.status(200).json(serializeFolder(res.folder));
  })
  .delete((req, res, next) => {
    const knexInstance = req.app.get("db");
    const folderId = req.params.folderId;

    FoldersService.deleteFolder(knexInstance, folderId).then(() => {
      return res.status(204).end();
    });
  })
  .patch(jsonParser, (req, res, next) => {
    const knexInstance = req.app.get("db");
    const folderId = req.params.folderId;
    const { name } = req.body;
    const updatedFolder = { name };

    const numOfValues = Object.values(updatedFolder).filter(Boolean).length;
    if (numOfValues === 0) {
      return res.status(400).json({
        error: {
          message: "request body must contain name"
        }
      });
    }
    FoldersService.updateFolder(knexInstance, folderId, updatedFolder)
      .then(() => {
        return res.status(204).end();
      })
      .catch(next);
  });

module.exports = foldersRouter;
