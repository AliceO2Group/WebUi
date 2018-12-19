{
  "variables": {
    "dep_root%": '$(QUALITYCONTROL_ROOT)'
  },
  'targets': [
    {   
      'include_dirs': ["<!@(node -p \"require('node-addon-api').include\")", "<@(dep_root)/include"],
      'dependencies': ["<!(node -p \"require('node-addon-api').gyp\")"],
      'target_name': 'tobject2json',
      'sources': [ 'tobject2json.cc' ],
      'conditions': [
        ['OS=="linux"', {
          "libraries": [
            "-ltobject2json",
            "-L<@(dep_root)/lib"
          ], 
          'cflags_cc': [ '-std=c++1z' ],
        }],
        ['OS=="mac"', {
          "libraries": [
            "-ltobject2json",
            "-L<@(dep_root)/lib",
            "-Wl,-rpath,<@(dep_root)/lib",
          ],
          'xcode_settings': {
            'OTHER_CFLAGS': [
              '-std=c++17', '-stdlib=libc++'
            ]
          }
        }]
      ],
      'defines': [ 'NAPI_DISABLE_CPP_EXCEPTIONS' ]
    }   
  ]
}
