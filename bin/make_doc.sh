#!/bin/sh
# NOTE: the jsdoc3.0.0-moogle custom template requires jsdoc 3.0.0
# ../../../jsdoc3/jsdoc ../src ../doc/README.md --destination ../doc/jsdoc --verbose --template ../git/fancytree/bin/jsdoc3-moogle
../../../jsdoc3.0.0/jsdoc ../src ../doc/README.md --destination ../doc/jsdoc --verbose --template ../git/fancytree/bin/jsdoc3.0.0-moogle

#cd ../../jsdoc-toolkit
#java -jar jsrun.jar app/run.js -t=templates/jsdoc --directory=../fancytree/doc/jsdoc2 --verbose ../fancytree/src/
