# InfoLogger protocol
Each log starts with asterisk (`*`) and terminates a new line character. Then it follows with protocol version and hash (`#`) separated values:

```
*1.4#[severity]#[level]#[stamp]#[hostname]#[rolename]#[pid]#[username]#[system]#[facility]#[detector]#[partition]#[run]#[errcode]#[errline]#[errsource]#[message]
```

See definition of different protocol version in the InfoLogger source code: https://github.com/AliceO2Group/InfoLogger/blob/master/src/infoLoggerMessage.c 
