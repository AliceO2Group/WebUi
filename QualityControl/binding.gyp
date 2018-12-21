{
  "variables": {
    "qc_root%": '$(QUALITYCONTROL_ROOT)',
    "root_include%": '$(ROOTSYS)/include'
  },
  'targets': [
    {   
      'include_dirs': ["<!@(node -p \"require('node-addon-api').include\")", "<@(qc_root)/include", "<@(root_include)", "$(CONFIGURATION_ROOT)/include" ],
      'dependencies': ["<!(node -p \"require('node-addon-api').gyp\")"],
      'target_name': 'tobject2json',
      'sources': [ 'tobject2json.cc' ],
      'conditions': [
        ['OS=="linux"', {
          "libraries": [
            "-lQualityControl",
            "-L<@(qc_root)/lib"
          ], 
          'cflags_cc': [ '-std=c++1z' ],
        }],
        ['OS=="mac"', {
          "libraries": [
            "-lQualityControl",
            "-L<@(qc_root)/lib",
            "-Wl,-rpath,<@(qc_root)/lib",
          ],
          'xcode_settings': {
            'OTHER_CFLAGS': [
              '-std=c++17', '-stdlib=libc++', '-frtti'
            ]
          }
        }]
      ],
      'defines': [ 'NAPI_DISABLE_CPP_EXCEPTIONS' ]
    }   
  ]
}
