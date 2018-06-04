#!/usr/bin/env node

// fake docker binary

console.error('a bunch of log lines that should not be processed by piped through to stdout');
console.log(JSON.stringify({
  statusCode: 200,
  body: {
    args: process.argv,
  }
}));
