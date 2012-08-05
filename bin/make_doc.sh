#!/bin/sh
../../jsdoc3/jsdoc ../src --destination ../doc/jsdoc3 --verbose

#../../jsdoc-toolkit/jsdoc ../src  --directory=../doc/jsdoc2 --verbose
cd ../../jsdoc-toolkit
java -jar jsrun.jar app/run.js -t=templates/jsdoc --directory=../fancytree/doc/jsdoc2 --verbose ../fancytree/src/
