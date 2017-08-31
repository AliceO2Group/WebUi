If you've installed ZeroMQ under custom path, npm install will fail with : *fatal error: zmq.h: No such file or directory*
To resolve this issue you need to recompile zmq module.

1. Go to ControGui directory
2. Download zeromq modue
     ```
     curl `npm v zeromq dist.tarball` | tar xvz && mv package/ node_modules/zeromq/
     ```
3. Add ZeroMQ include directory to *node_modules/zeromq/binding.gyp* file after line 67
     ```
     '-I/<ZeroMQPath>/include/'
     ```
4. Run again 
     ```
     npm install
     ```
