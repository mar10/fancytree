"""
Generate Fancytree test data.
Example:
    $ python ft_fixtures.py
"""
import json
import os
from pprint import pformat
import random

from fabulist import Fabulist


class GenerateTreeData(object):
    """."""
    def __init__(self):
        self.fab = Fabulist()
        self.count = 0
        self.data = {}

    @staticmethod
    def get_count(count):
        if type(count) in ("tuple", "list"):
            count = random.randrange(count[0], count[1])
        return int(count)

    def _generate(self, parent_node, child_def, common):
        fab = self.fab
        child_node_list = parent_node["children"] = []
        child_count = self.get_count(child_def["count"])
        sub_child_def = child_def.get("children")
        for i in range(child_count):
            node = {
                "title": fab.get_quote(child_def["title"]),
                "key": "{}.{}".format(parent_node["key"], i+1) if parent_node.get("key") else str(i+1)
            }
            child_node_list.append(node)
            self.count += 1
            if sub_child_def:
                self._generate(node, sub_child_def, common)

        return child_node_list

    def generate(self, opts, meta=None):
        self.data = {}
        if meta:
            self.data.update(meta)
        common = opts.get("common", {})
        child_def = opts.get("children", [])
        self._generate(self.data, child_def, common)
        if meta is None:
            return self.data["children"]
        return self.data

    def write(self, path, opts, meta=None):
        with open(path, "wt") as f:
            res = self.generate(opts, meta)
            json.dump(res, f)
        return


def test():
    g = GenerateTreeData()
    opts = {
        "common": {},
        "children": {
            "title": "$(Noun)",
            "count": 10,
            "children": {
                "title": "$(Adj) $(noun)",
                "count": 100,
                "children": {
                    "title": "$(Verb:ing) $(adv)",
                    "count": 100,
                    },
                },
            },
        }

    # res = g.generate(opts)
    # print(pformat(res))
    path = "/Users/martin/prj/git/fabulist-demo-flask/fabulator/trees.json"
    print("Generate data in {}...".format(path))
    res = g.write(path, opts)
    print("Generated {} nodes.".format(g.count))

if __name__ == "__main__":
    test()
