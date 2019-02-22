const fs = require("fs")
const pathHelp = require('path');

module.exports = function(babel) {

    return {
        visitor: {
            ImportDeclaration: function ImportDeclaration(path, state) {

              if( ! path.node.source.value.endsWith("/*"))
              return;

              const storePath = path.node.source.value.slice(0,-2);
              const result = path.node.specifiers[0].local.name;

              let targetPath
              if(state.file.opts.sourceFileName){
                  const sourceFileName = state.file.opts.sourceFileName.split("../").pop()
                  targetPath = pathHelp.join(sourceFileName,"../",storePath)
              } else {
                  targetPath = storePath
              }

              const folderMap = {};
              let imports = [];

                fs.readdirSync(targetPath,{withFileTypes:true}).forEach(dirent => {
                  const direntName = dirent.name||dirent
                  if(dirent.isDirectory ? dirent.isDirectory() : ! direntName.includes('.')){

                    fs.readdirSync(targetPath+"/"+direntName).forEach(actionFile => {

                      if('_' !== actionFile[0] && ! actionFile.endsWith(".json")){
                      const actionName = actionFile.split(".").slice(0, -1).join('.')
                        folderMap[direntName] = folderMap[direntName] || {}
                        folderMap[direntName][actionName] = {
                          all:direntName+actionName+"all"
                        }

                        imports.push("import * as "+direntName+actionName+"all from '"+storePath+"/"+direntName+"/"+actionFile+"'")

                      }
                    })
                  }
              })

              let combin = "const "+result+" = {"
              Object.keys(folderMap).map(reducer => {
                combin += reducer + ":{"
                Object.keys(folderMap[reducer]).map(file => {
                  combin += file + ":"+folderMap[reducer][file].all+","
                })
                combin +=  "},"
              })
              combin += "};"


              imports.push(combin)

              path.replaceWithMultiple(
                imports.map(function(importString) {
                  const importarr = [importString]
                  importarr.raw = [importString]
                  return babel.template.statement.ast(importarr)
                }));

            }// END ImportDeclaration
        } // END visitor
    } // END return
}// END exports.default
