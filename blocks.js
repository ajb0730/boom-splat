[{
  "type": "bot_turn",
  "message0": "turn %1",
  "args0": [
    {
      "type": "field_dropdown",
      "name": "DIRECTION",
      "options": [
        [
          "left ↶",
          "LEFT"
        ],
        [
          "right ↷",
          "RIGHT"
        ]
      ]
    }
  ],
  "previousStatement": null,
  "nextStatement": null,
  "colour": 230,
  "tooltip": "rotate bot in given direction",
  "helpUrl": ""
},
{
  "type": "bot_forward",
  "message0": "move forward",
  "previousStatement": null,
  "nextStatement": null,
  "colour": 230,
  "tooltip": "move bot one step forward in direction bot is facing",
  "helpUrl": ""
},
{
  "type": "bot_tag",
  "message0": "tag",
  "previousStatement": null,
  "nextStatement": null,
  "colour": 230,
  "tooltip": "tag any bot in the space immediately in front",
  "helpUrl": ""
},
{
  "type": "bot_distancetowall",
  "message0": "distance to wall",
  "output": "Number",
  "colour": 120,
  "tooltip": "number of spaces until the next wall",
  "helpUrl": ""
},
{
  "type": "bot_distancetobot",
  "message0": "distance to bot",
  "output": "Number",
  "colour": 120,
  "tooltip": "number of space until next bot, or 0 if no bot in front",
  "helpUrl": ""
},
{
  "type": "bot_botinfront",
  "message0": "bot in front",
  "output": "Boolean",
  "colour": 20,
  "tooltip": "yes/no if there is a bot immediately in front",
  "helpUrl": ""
},
{
  "type": "block_while",
  "message0": "while %1 %2",
  "args0": [
    {
      "type": "input_value",
      "name": "CONDITION",
      "check": "Boolean"
    },
    {
      "type": "input_statement",
      "name": "STATEMENTS"
    }
  ],
  "previousStatement": null,
  "nextStatement": null,
  "colour": 290,
  "tooltip": "",
  "helpUrl": ""
},
{
  "type": "block_if",
  "message0": "if %1 %2",
  "args0": [
    {
      "type": "input_value",
      "name": "CONDITION",
      "check": "Boolean"
    },
    {
      "type": "input_statement",
      "name": "STATEMENTS"
    }
  ],
  "previousStatement": null,
  "nextStatement": null,
  "colour": 290,
  "tooltip": "",
  "helpUrl": ""
},
{
  "type": "block_random",
  "message0": "random number from %1 to %2",
  "args0": [
    {
      "type": "field_number",
      "name": "START",
      "value": 0
    },
    {
      "type": "field_number",
      "name": "END",
      "value": 0
    }
  ],
  "output": "Number",
  "colour": 120,
  "tooltip": "",
  "helpUrl": ""
},
{
  "type": "block_compare",
  "message0": "%1 %2 %3",
  "args0": [
    {
      "type": "input_value",
      "name": "LEFT",
      "check": "Number"
    },
    {
      "type": "field_dropdown",
      "name": "OPERATOR",
      "options": [
        [
          "<",
          "LESS_THAN"
        ],
        [
          "<=",
          "LESS_EQUAL"
        ],
        [
          "=",
          "EQUAL"
        ],
        [
          "<>",
          "NOT_EQUAL"
        ],
        [
          ">=",
          "GREATER_EQUAL"
        ],
        [
          ">",
          "GREATER_THAN"
        ]
      ]
    },
    {
      "type": "input_value",
      "name": "RIGHT",
      "check": "Number"
    }
  ],
  "inputsInline": true,
  "output": "Boolean",
  "colour": 20,
  "tooltip": "compare two numbers",
  "helpUrl": ""
},
{
  "type": "block_number",
  "message0": "%1",
  "args0": [
    {
      "type": "field_number",
      "name": "VALUE",
      "value": 0
    }
  ],
  "output": "Number",
  "colour": 120,
  "tooltip": "",
  "helpUrl": ""
},
{
  "type": "block_boolean",
  "message0": "%1",
  "args0": [
    {
      "type": "field_dropdown",
      "name": "VALUE",
      "options": [
        [
          "true",
          "TRUE"
        ],
        [
          "false",
          "FALSE"
        ]
      ]
    }
  ],
  "output": "Boolean",
  "colour": 20,
  "tooltip": "",
  "helpUrl": ""
}]