#!/bin/sh
../../jsdoc3/jsdoc ../src --destination ../doc/jsdoc3 --verbose --template ../fancytree/bin/jsdoc3-moogle

cd ../../jsdoc-toolkit
java -jar jsrun.jar app/run.js -t=templates/jsdoc --directory=../fancytree/doc/jsdoc2 --verbose ../fancytree/src/
