#!/bin/sh
pwd
echo $PYTHONPATH
/usr/local/bin/tabfix --no-backup -t -r -m*.js -m*.css -m*.html demo
/usr/local/bin/tabfix --no-backup -t -r -m*.js -m*.css -m*.html doc
/usr/local/bin/tabfix --no-backup -t -r -m*.js -m*.css -m*.html src
/usr/local/bin/tabfix --no-backup -t -r -m*.js -m*.css -m*.html test
