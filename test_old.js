var Module;
if (!Module) Module = (typeof Module !== "undefined" ? Module : null) || {};
var moduleOverrides = {};
for (var key in Module) {
 if (Module.hasOwnProperty(key)) {
  moduleOverrides[key] = Module[key];
 }
}
var ENVIRONMENT_IS_WEB = false;
var ENVIRONMENT_IS_WORKER = false;
var ENVIRONMENT_IS_NODE = false;
var ENVIRONMENT_IS_SHELL = false;
if (Module["ENVIRONMENT"]) {
 if (Module["ENVIRONMENT"] === "WEB") {
  ENVIRONMENT_IS_WEB = true;
 } else if (Module["ENVIRONMENT"] === "WORKER") {
  ENVIRONMENT_IS_WORKER = true;
 } else if (Module["ENVIRONMENT"] === "NODE") {
  ENVIRONMENT_IS_NODE = true;
 } else if (Module["ENVIRONMENT"] === "SHELL") {
  ENVIRONMENT_IS_SHELL = true;
 } else {
  throw new Error("The provided Module['ENVIRONMENT'] value is not valid. It must be one of: WEB|WORKER|NODE|SHELL.");
 }
} else {
 ENVIRONMENT_IS_WEB = typeof window === "object";
 ENVIRONMENT_IS_WORKER = typeof importScripts === "function";
 ENVIRONMENT_IS_NODE = typeof process === "object" && typeof require === "function" && !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_WORKER;
 ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
}
if (ENVIRONMENT_IS_NODE) {
 if (!Module["print"]) Module["print"] = console.log;
 if (!Module["printErr"]) Module["printErr"] = console.warn;
 var nodeFS;
 var nodePath;
 Module["read"] = function read(filename, binary) {
  if (!nodeFS) nodeFS = require("fs");
  if (!nodePath) nodePath = require("path");
  filename = nodePath["normalize"](filename);
  var ret = nodeFS["readFileSync"](filename);
  return binary ? ret : ret.toString();
 };
 Module["readBinary"] = function readBinary(filename) {
  var ret = Module["read"](filename, true);
  if (!ret.buffer) {
   ret = new Uint8Array(ret);
  }
  assert(ret.buffer);
  return ret;
 };
 Module["load"] = function load(f) {
  globalEval(read(f));
 };
 if (!Module["thisProgram"]) {
  if (process["argv"].length > 1) {
   Module["thisProgram"] = process["argv"][1].replace(/\\/g, "/");
  } else {
   Module["thisProgram"] = "unknown-program";
  }
 }
 Module["arguments"] = process["argv"].slice(2);
 if (typeof module !== "undefined") {
  module["exports"] = Module;
 }
 process["on"]("uncaughtException", (function(ex) {
  if (!(ex instanceof ExitStatus)) {
   throw ex;
  }
 }));
 Module["inspect"] = (function() {
  return "[Emscripten Module object]";
 });
} else if (ENVIRONMENT_IS_SHELL) {
 if (!Module["print"]) Module["print"] = print;
 if (typeof printErr != "undefined") Module["printErr"] = printErr;
 if (typeof read != "undefined") {
  Module["read"] = read;
 } else {
  Module["read"] = function read() {
   throw "no read() available";
  };
 }
 Module["readBinary"] = function readBinary(f) {
  if (typeof readbuffer === "function") {
   return new Uint8Array(readbuffer(f));
  }
  var data = read(f, "binary");
  assert(typeof data === "object");
  return data;
 };
 if (typeof scriptArgs != "undefined") {
  Module["arguments"] = scriptArgs;
 } else if (typeof arguments != "undefined") {
  Module["arguments"] = arguments;
 }
} else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
 Module["read"] = function read(url) {
  var xhr = new XMLHttpRequest;
  xhr.open("GET", url, false);
  xhr.send(null);
  return xhr.responseText;
 };
 Module["readAsync"] = function readAsync(url, onload, onerror) {
  var xhr = new XMLHttpRequest;
  xhr.open("GET", url, true);
  xhr.responseType = "arraybuffer";
  xhr.onload = function xhr_onload() {
   if (xhr.status == 200 || xhr.status == 0 && xhr.response) {
    onload(xhr.response);
   } else {
    onerror();
   }
  };
  xhr.onerror = onerror;
  xhr.send(null);
 };
 if (typeof arguments != "undefined") {
  Module["arguments"] = arguments;
 }
 if (typeof console !== "undefined") {
  if (!Module["print"]) Module["print"] = function print(x) {
   console.log(x);
  };
  if (!Module["printErr"]) Module["printErr"] = function printErr(x) {
   console.warn(x);
  };
 } else {
  var TRY_USE_DUMP = false;
  if (!Module["print"]) Module["print"] = TRY_USE_DUMP && typeof dump !== "undefined" ? (function(x) {
   dump(x);
  }) : (function(x) {});
 }
 if (ENVIRONMENT_IS_WORKER) {
  Module["load"] = importScripts;
 }
 if (typeof Module["setWindowTitle"] === "undefined") {
  Module["setWindowTitle"] = (function(title) {
   document.title = title;
  });
 }
} else {
 throw "Unknown runtime environment. Where are we?";
}
function globalEval(x) {
 eval.call(null, x);
}
if (!Module["load"] && Module["read"]) {
 Module["load"] = function load(f) {
  globalEval(Module["read"](f));
 };
}
if (!Module["print"]) {
 Module["print"] = (function() {});
}
if (!Module["printErr"]) {
 Module["printErr"] = Module["print"];
}
if (!Module["arguments"]) {
 Module["arguments"] = [];
}
if (!Module["thisProgram"]) {
 Module["thisProgram"] = "./this.program";
}
Module.print = Module["print"];
Module.printErr = Module["printErr"];
Module["preRun"] = [];
Module["postRun"] = [];
for (var key in moduleOverrides) {
 if (moduleOverrides.hasOwnProperty(key)) {
  Module[key] = moduleOverrides[key];
 }
}
moduleOverrides = undefined;
var Runtime = {
 setTempRet0: (function(value) {
  tempRet0 = value;
  return value;
 }),
 getTempRet0: (function() {
  return tempRet0;
 }),
 stackSave: (function() {
  return STACKTOP;
 }),
 stackRestore: (function(stackTop) {
  STACKTOP = stackTop;
 }),
 getNativeTypeSize: (function(type) {
  switch (type) {
  case "i1":
  case "i8":
   return 1;
  case "i16":
   return 2;
  case "i32":
   return 4;
  case "i64":
   return 8;
  case "float":
   return 4;
  case "double":
   return 8;
  default:
   {
    if (type[type.length - 1] === "*") {
     return Runtime.QUANTUM_SIZE;
    } else if (type[0] === "i") {
     var bits = parseInt(type.substr(1));
     assert(bits % 8 === 0);
     return bits / 8;
    } else {
     return 0;
    }
   }
  }
 }),
 getNativeFieldSize: (function(type) {
  return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE);
 }),
 STACK_ALIGN: 16,
 prepVararg: (function(ptr, type) {
  if (type === "double" || type === "i64") {
   if (ptr & 7) {
    assert((ptr & 7) === 4);
    ptr += 4;
   }
  } else {
   assert((ptr & 3) === 0);
  }
  return ptr;
 }),
 getAlignSize: (function(type, size, vararg) {
  if (!vararg && (type == "i64" || type == "double")) return 8;
  if (!type) return Math.min(size, 8);
  return Math.min(size || (type ? Runtime.getNativeFieldSize(type) : 0), Runtime.QUANTUM_SIZE);
 }),
 dynCall: (function(sig, ptr, args) {
  if (args && args.length) {
   return Module["dynCall_" + sig].apply(null, [ ptr ].concat(args));
  } else {
   return Module["dynCall_" + sig].call(null, ptr);
  }
 }),
 functionPointers: [],
 addFunction: (function(func) {
  for (var i = 0; i < Runtime.functionPointers.length; i++) {
   if (!Runtime.functionPointers[i]) {
    Runtime.functionPointers[i] = func;
    return 2 * (1 + i);
   }
  }
  throw "Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS.";
 }),
 removeFunction: (function(index) {
  Runtime.functionPointers[(index - 2) / 2] = null;
 }),
 warnOnce: (function(text) {
  if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
  if (!Runtime.warnOnce.shown[text]) {
   Runtime.warnOnce.shown[text] = 1;
   Module.printErr(text);
  }
 }),
 funcWrappers: {},
 getFuncWrapper: (function(func, sig) {
  assert(sig);
  if (!Runtime.funcWrappers[sig]) {
   Runtime.funcWrappers[sig] = {};
  }
  var sigCache = Runtime.funcWrappers[sig];
  if (!sigCache[func]) {
   if (sig.length === 1) {
    sigCache[func] = function dynCall_wrapper() {
     return Runtime.dynCall(sig, func);
    };
   } else if (sig.length === 2) {
    sigCache[func] = function dynCall_wrapper(arg) {
     return Runtime.dynCall(sig, func, [ arg ]);
    };
   } else {
    sigCache[func] = function dynCall_wrapper() {
     return Runtime.dynCall(sig, func, Array.prototype.slice.call(arguments));
    };
   }
  }
  return sigCache[func];
 }),
 getCompilerSetting: (function(name) {
  throw "You must build with -s RETAIN_COMPILER_SETTINGS=1 for Runtime.getCompilerSetting or emscripten_get_compiler_setting to work";
 }),
 stackAlloc: (function(size) {
  var ret = STACKTOP;
  STACKTOP = STACKTOP + size | 0;
  STACKTOP = STACKTOP + 15 & -16;
  return ret;
 }),
 staticAlloc: (function(size) {
  var ret = STATICTOP;
  STATICTOP = STATICTOP + size | 0;
  STATICTOP = STATICTOP + 15 & -16;
  return ret;
 }),
 dynamicAlloc: (function(size) {
  var ret = HEAP32[DYNAMICTOP_PTR >> 2];
  var end = (ret + size + 15 | 0) & -16;
  HEAP32[DYNAMICTOP_PTR >> 2] = end;
  if (end >= TOTAL_MEMORY) {
   var success = enlargeMemory();
   if (!success) {
    HEAP32[DYNAMICTOP_PTR >> 2] = ret;
    return 0;
   }
  }
  return ret;
 }),
 alignMemory: (function(size, quantum) {
  var ret = size = Math.ceil(size / (quantum ? quantum : 16)) * (quantum ? quantum : 16);
  return ret;
 }),
 makeBigInt: (function(low, high, unsigned) {
  var ret = unsigned ? +(low >>> 0) + +(high >>> 0) * +4294967296 : +(low >>> 0) + +(high | 0) * +4294967296;
  return ret;
 }),
 GLOBAL_BASE: 8,
 QUANTUM_SIZE: 4,
 __dummy__: 0
};
Module["Runtime"] = Runtime;
var ABORT = 0;
var EXITSTATUS = 0;
function assert(condition, text) {
 if (!condition) {
  abort("Assertion failed: " + text);
 }
}
function getCFunc(ident) {
 var func = Module["_" + ident];
 if (!func) {
  try {
   func = eval("_" + ident);
  } catch (e) {}
 }
 assert(func, "Cannot call unknown function " + ident + " (perhaps LLVM optimizations or closure removed it?)");
 return func;
}
var cwrap, ccall;
((function() {
 var JSfuncs = {
  "stackSave": (function() {
   Runtime.stackSave();
  }),
  "stackRestore": (function() {
   Runtime.stackRestore();
  }),
  "arrayToC": (function(arr) {
   var ret = Runtime.stackAlloc(arr.length);
   writeArrayToMemory(arr, ret);
   return ret;
  }),
  "stringToC": (function(str) {
   var ret = 0;
   if (str !== null && str !== undefined && str !== 0) {
    var len = (str.length << 2) + 1;
    ret = Runtime.stackAlloc(len);
    stringToUTF8(str, ret, len);
   }
   return ret;
  })
 };
 var toC = {
  "string": JSfuncs["stringToC"],
  "array": JSfuncs["arrayToC"]
 };
 ccall = function ccallFunc(ident, returnType, argTypes, args, opts) {
  var func = getCFunc(ident);
  var cArgs = [];
  var stack = 0;
  if (args) {
   for (var i = 0; i < args.length; i++) {
    var converter = toC[argTypes[i]];
    if (converter) {
     if (stack === 0) stack = Runtime.stackSave();
     cArgs[i] = converter(args[i]);
    } else {
     cArgs[i] = args[i];
    }
   }
  }
  var ret = func.apply(null, cArgs);
  if (returnType === "string") ret = Pointer_stringify(ret);
  if (stack !== 0) {
   if (opts && opts.async) {
    EmterpreterAsync.asyncFinalizers.push((function() {
     Runtime.stackRestore(stack);
    }));
    return;
   }
   Runtime.stackRestore(stack);
  }
  return ret;
 };
 var sourceRegex = /^function\s*[a-zA-Z$_0-9]*\s*\(([^)]*)\)\s*{\s*([^*]*?)[\s;]*(?:return\s*(.*?)[;\s]*)?}$/;
 function parseJSFunc(jsfunc) {
  var parsed = jsfunc.toString().match(sourceRegex).slice(1);
  return {
   arguments: parsed[0],
   body: parsed[1],
   returnValue: parsed[2]
  };
 }
 var JSsource = null;
 function ensureJSsource() {
  if (!JSsource) {
   JSsource = {};
   for (var fun in JSfuncs) {
    if (JSfuncs.hasOwnProperty(fun)) {
     JSsource[fun] = parseJSFunc(JSfuncs[fun]);
    }
   }
  }
 }
 cwrap = function cwrap(ident, returnType, argTypes) {
  argTypes = argTypes || [];
  var cfunc = getCFunc(ident);
  var numericArgs = argTypes.every((function(type) {
   return type === "number";
  }));
  var numericRet = returnType !== "string";
  if (numericRet && numericArgs) {
   return cfunc;
  }
  var argNames = argTypes.map((function(x, i) {
   return "$" + i;
  }));
  var funcstr = "(function(" + argNames.join(",") + ") {";
  var nargs = argTypes.length;
  if (!numericArgs) {
   ensureJSsource();
   funcstr += "var stack = " + JSsource["stackSave"].body + ";";
   for (var i = 0; i < nargs; i++) {
    var arg = argNames[i], type = argTypes[i];
    if (type === "number") continue;
    var convertCode = JSsource[type + "ToC"];
    funcstr += "var " + convertCode.arguments + " = " + arg + ";";
    funcstr += convertCode.body + ";";
    funcstr += arg + "=(" + convertCode.returnValue + ");";
   }
  }
  var cfuncname = parseJSFunc((function() {
   return cfunc;
  })).returnValue;
  funcstr += "var ret = " + cfuncname + "(" + argNames.join(",") + ");";
  if (!numericRet) {
   var strgfy = parseJSFunc((function() {
    return Pointer_stringify;
   })).returnValue;
   funcstr += "ret = " + strgfy + "(ret);";
  }
  if (!numericArgs) {
   ensureJSsource();
   funcstr += JSsource["stackRestore"].body.replace("()", "(stack)") + ";";
  }
  funcstr += "return ret})";
  return eval(funcstr);
 };
}))();
Module["ccall"] = ccall;
Module["cwrap"] = cwrap;
function setValue(ptr, value, type, noSafe) {
 type = type || "i8";
 if (type.charAt(type.length - 1) === "*") type = "i32";
 switch (type) {
 case "i1":
  HEAP8[ptr >> 0] = value;
  break;
 case "i8":
  HEAP8[ptr >> 0] = value;
  break;
 case "i16":
  HEAP16[ptr >> 1] = value;
  break;
 case "i32":
  HEAP32[ptr >> 2] = value;
  break;
 case "i64":
  tempI64 = [ value >>> 0, (tempDouble = value, +Math_abs(tempDouble) >= +1 ? tempDouble > +0 ? (Math_min(+Math_floor(tempDouble / +4294967296), +4294967295) | 0) >>> 0 : ~~+Math_ceil((tempDouble - +(~~tempDouble >>> 0)) / +4294967296) >>> 0 : 0) ], HEAP32[ptr >> 2] = tempI64[0], HEAP32[ptr + 4 >> 2] = tempI64[1];
  break;
 case "float":
  HEAPF32[ptr >> 2] = value;
  break;
 case "double":
  HEAPF64[ptr >> 3] = value;
  break;
 default:
  abort("invalid type for setValue: " + type);
 }
}
Module["setValue"] = setValue;
function getValue(ptr, type, noSafe) {
 type = type || "i8";
 if (type.charAt(type.length - 1) === "*") type = "i32";
 switch (type) {
 case "i1":
  return HEAP8[ptr >> 0];
 case "i8":
  return HEAP8[ptr >> 0];
 case "i16":
  return HEAP16[ptr >> 1];
 case "i32":
  return HEAP32[ptr >> 2];
 case "i64":
  return HEAP32[ptr >> 2];
 case "float":
  return HEAPF32[ptr >> 2];
 case "double":
  return HEAPF64[ptr >> 3];
 default:
  abort("invalid type for setValue: " + type);
 }
 return null;
}
Module["getValue"] = getValue;
var ALLOC_NORMAL = 0;
var ALLOC_STACK = 1;
var ALLOC_STATIC = 2;
var ALLOC_DYNAMIC = 3;
var ALLOC_NONE = 4;
Module["ALLOC_NORMAL"] = ALLOC_NORMAL;
Module["ALLOC_STACK"] = ALLOC_STACK;
Module["ALLOC_STATIC"] = ALLOC_STATIC;
Module["ALLOC_DYNAMIC"] = ALLOC_DYNAMIC;
Module["ALLOC_NONE"] = ALLOC_NONE;
function allocate(slab, types, allocator, ptr) {
 var zeroinit, size;
 if (typeof slab === "number") {
  zeroinit = true;
  size = slab;
 } else {
  zeroinit = false;
  size = slab.length;
 }
 var singleType = typeof types === "string" ? types : null;
 var ret;
 if (allocator == ALLOC_NONE) {
  ret = ptr;
 } else {
  ret = [ typeof _malloc === "function" ? _malloc : Runtime.staticAlloc, Runtime.stackAlloc, Runtime.staticAlloc, Runtime.dynamicAlloc ][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
 }
 if (zeroinit) {
  var ptr = ret, stop;
  assert((ret & 3) == 0);
  stop = ret + (size & ~3);
  for (; ptr < stop; ptr += 4) {
   HEAP32[ptr >> 2] = 0;
  }
  stop = ret + size;
  while (ptr < stop) {
   HEAP8[ptr++ >> 0] = 0;
  }
  return ret;
 }
 if (singleType === "i8") {
  if (slab.subarray || slab.slice) {
   HEAPU8.set(slab, ret);
  } else {
   HEAPU8.set(new Uint8Array(slab), ret);
  }
  return ret;
 }
 var i = 0, type, typeSize, previousType;
 while (i < size) {
  var curr = slab[i];
  if (typeof curr === "function") {
   curr = Runtime.getFunctionIndex(curr);
  }
  type = singleType || types[i];
  if (type === 0) {
   i++;
   continue;
  }
  if (type == "i64") type = "i32";
  setValue(ret + i, curr, type);
  if (previousType !== type) {
   typeSize = Runtime.getNativeTypeSize(type);
   previousType = type;
  }
  i += typeSize;
 }
 return ret;
}
Module["allocate"] = allocate;
function getMemory(size) {
 if (!staticSealed) return Runtime.staticAlloc(size);
 if (!runtimeInitialized) return Runtime.dynamicAlloc(size);
 return _malloc(size);
}
Module["getMemory"] = getMemory;
function Pointer_stringify(ptr, length) {
 if (length === 0 || !ptr) return "";
 var hasUtf = 0;
 var t;
 var i = 0;
 while (1) {
  t = HEAPU8[ptr + i >> 0];
  hasUtf |= t;
  if (t == 0 && !length) break;
  i++;
  if (length && i == length) break;
 }
 if (!length) length = i;
 var ret = "";
 if (hasUtf < 128) {
  var MAX_CHUNK = 1024;
  var curr;
  while (length > 0) {
   curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
   ret = ret ? ret + curr : curr;
   ptr += MAX_CHUNK;
   length -= MAX_CHUNK;
  }
  return ret;
 }
 return Module["UTF8ToString"](ptr);
}
Module["Pointer_stringify"] = Pointer_stringify;
function AsciiToString(ptr) {
 var str = "";
 while (1) {
  var ch = HEAP8[ptr++ >> 0];
  if (!ch) return str;
  str += String.fromCharCode(ch);
 }
}
Module["AsciiToString"] = AsciiToString;
function stringToAscii(str, outPtr) {
 return writeAsciiToMemory(str, outPtr, false);
}
Module["stringToAscii"] = stringToAscii;
var UTF8Decoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf8") : undefined;
function UTF8ArrayToString(u8Array, idx) {
 var endPtr = idx;
 while (u8Array[endPtr]) ++endPtr;
 if (endPtr - idx > 16 && u8Array.subarray && UTF8Decoder) {
  return UTF8Decoder.decode(u8Array.subarray(idx, endPtr));
 } else {
  var u0, u1, u2, u3, u4, u5;
  var str = "";
  while (1) {
   u0 = u8Array[idx++];
   if (!u0) return str;
   if (!(u0 & 128)) {
    str += String.fromCharCode(u0);
    continue;
   }
   u1 = u8Array[idx++] & 63;
   if ((u0 & 224) == 192) {
    str += String.fromCharCode((u0 & 31) << 6 | u1);
    continue;
   }
   u2 = u8Array[idx++] & 63;
   if ((u0 & 240) == 224) {
    u0 = (u0 & 15) << 12 | u1 << 6 | u2;
   } else {
    u3 = u8Array[idx++] & 63;
    if ((u0 & 248) == 240) {
     u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | u3;
    } else {
     u4 = u8Array[idx++] & 63;
     if ((u0 & 252) == 248) {
      u0 = (u0 & 3) << 24 | u1 << 18 | u2 << 12 | u3 << 6 | u4;
     } else {
      u5 = u8Array[idx++] & 63;
      u0 = (u0 & 1) << 30 | u1 << 24 | u2 << 18 | u3 << 12 | u4 << 6 | u5;
     }
    }
   }
   if (u0 < 65536) {
    str += String.fromCharCode(u0);
   } else {
    var ch = u0 - 65536;
    str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023);
   }
  }
 }
}
Module["UTF8ArrayToString"] = UTF8ArrayToString;
function UTF8ToString(ptr) {
 return UTF8ArrayToString(HEAPU8, ptr);
}
Module["UTF8ToString"] = UTF8ToString;
function stringToUTF8Array(str, outU8Array, outIdx, maxBytesToWrite) {
 if (!(maxBytesToWrite > 0)) return 0;
 var startIdx = outIdx;
 var endIdx = outIdx + maxBytesToWrite - 1;
 for (var i = 0; i < str.length; ++i) {
  var u = str.charCodeAt(i);
  if (u >= 55296 && u <= 57343) u = 65536 + ((u & 1023) << 10) | str.charCodeAt(++i) & 1023;
  if (u <= 127) {
   if (outIdx >= endIdx) break;
   outU8Array[outIdx++] = u;
  } else if (u <= 2047) {
   if (outIdx + 1 >= endIdx) break;
   outU8Array[outIdx++] = 192 | u >> 6;
   outU8Array[outIdx++] = 128 | u & 63;
  } else if (u <= 65535) {
   if (outIdx + 2 >= endIdx) break;
   outU8Array[outIdx++] = 224 | u >> 12;
   outU8Array[outIdx++] = 128 | u >> 6 & 63;
   outU8Array[outIdx++] = 128 | u & 63;
  } else if (u <= 2097151) {
   if (outIdx + 3 >= endIdx) break;
   outU8Array[outIdx++] = 240 | u >> 18;
   outU8Array[outIdx++] = 128 | u >> 12 & 63;
   outU8Array[outIdx++] = 128 | u >> 6 & 63;
   outU8Array[outIdx++] = 128 | u & 63;
  } else if (u <= 67108863) {
   if (outIdx + 4 >= endIdx) break;
   outU8Array[outIdx++] = 248 | u >> 24;
   outU8Array[outIdx++] = 128 | u >> 18 & 63;
   outU8Array[outIdx++] = 128 | u >> 12 & 63;
   outU8Array[outIdx++] = 128 | u >> 6 & 63;
   outU8Array[outIdx++] = 128 | u & 63;
  } else {
   if (outIdx + 5 >= endIdx) break;
   outU8Array[outIdx++] = 252 | u >> 30;
   outU8Array[outIdx++] = 128 | u >> 24 & 63;
   outU8Array[outIdx++] = 128 | u >> 18 & 63;
   outU8Array[outIdx++] = 128 | u >> 12 & 63;
   outU8Array[outIdx++] = 128 | u >> 6 & 63;
   outU8Array[outIdx++] = 128 | u & 63;
  }
 }
 outU8Array[outIdx] = 0;
 return outIdx - startIdx;
}
Module["stringToUTF8Array"] = stringToUTF8Array;
function stringToUTF8(str, outPtr, maxBytesToWrite) {
 return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
}
Module["stringToUTF8"] = stringToUTF8;
function lengthBytesUTF8(str) {
 var len = 0;
 for (var i = 0; i < str.length; ++i) {
  var u = str.charCodeAt(i);
  if (u >= 55296 && u <= 57343) u = 65536 + ((u & 1023) << 10) | str.charCodeAt(++i) & 1023;
  if (u <= 127) {
   ++len;
  } else if (u <= 2047) {
   len += 2;
  } else if (u <= 65535) {
   len += 3;
  } else if (u <= 2097151) {
   len += 4;
  } else if (u <= 67108863) {
   len += 5;
  } else {
   len += 6;
  }
 }
 return len;
}
Module["lengthBytesUTF8"] = lengthBytesUTF8;
var UTF16Decoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf-16le") : undefined;
function demangle(func) {
 var __cxa_demangle_func = Module["___cxa_demangle"] || Module["__cxa_demangle"];
 if (__cxa_demangle_func) {
  try {
   var s = func.substr(1);
   var len = lengthBytesUTF8(s) + 1;
   var buf = _malloc(len);
   stringToUTF8(s, buf, len);
   var status = _malloc(4);
   var ret = __cxa_demangle_func(buf, 0, 0, status);
   if (getValue(status, "i32") === 0 && ret) {
    return Pointer_stringify(ret);
   }
  } catch (e) {} finally {
   if (buf) _free(buf);
   if (status) _free(status);
   if (ret) _free(ret);
  }
  return func;
 }
 Runtime.warnOnce("warning: build with  -s DEMANGLE_SUPPORT=1  to link in libcxxabi demangling");
 return func;
}
function demangleAll(text) {
 var regex = /__Z[\w\d_]+/g;
 return text.replace(regex, (function(x) {
  var y = demangle(x);
  return x === y ? x : x + " [" + y + "]";
 }));
}
function jsStackTrace() {
 var err = new Error;
 if (!err.stack) {
  try {
   throw new Error(0);
  } catch (e) {
   err = e;
  }
  if (!err.stack) {
   return "(no stack trace available)";
  }
 }
 return err.stack.toString();
}
function stackTrace() {
 var js = jsStackTrace();
 if (Module["extraStackTrace"]) js += "\n" + Module["extraStackTrace"]();
 return demangleAll(js);
}
Module["stackTrace"] = stackTrace;
var HEAP;
var buffer;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
function updateGlobalBufferViews() {
 Module["HEAP8"] = HEAP8 = new Int8Array(buffer);
 Module["HEAP16"] = HEAP16 = new Int16Array(buffer);
 Module["HEAP32"] = HEAP32 = new Int32Array(buffer);
 Module["HEAPU8"] = HEAPU8 = new Uint8Array(buffer);
 Module["HEAPU16"] = HEAPU16 = new Uint16Array(buffer);
 Module["HEAPU32"] = HEAPU32 = new Uint32Array(buffer);
 Module["HEAPF32"] = HEAPF32 = new Float32Array(buffer);
 Module["HEAPF64"] = HEAPF64 = new Float64Array(buffer);
}
var STATIC_BASE, STATICTOP, staticSealed;
var STACK_BASE, STACKTOP, STACK_MAX;
var DYNAMIC_BASE, DYNAMICTOP_PTR;
STATIC_BASE = STATICTOP = STACK_BASE = STACKTOP = STACK_MAX = DYNAMIC_BASE = DYNAMICTOP_PTR = 0;
staticSealed = false;
function abortOnCannotGrowMemory() {
 abort("Cannot enlarge memory arrays. Either (1) compile with  -s TOTAL_MEMORY=X  with X higher than the current value " + TOTAL_MEMORY + ", (2) compile with  -s ALLOW_MEMORY_GROWTH=1  which adjusts the size at runtime but prevents some optimizations, (3) set Module.TOTAL_MEMORY to a higher value before the program runs, or if you want malloc to return NULL (0) instead of this abort, compile with  -s ABORTING_MALLOC=0 ");
}
function enlargeMemory() {
 abortOnCannotGrowMemory();
}
var TOTAL_STACK = Module["TOTAL_STACK"] || 5242880;
var TOTAL_MEMORY = Module["TOTAL_MEMORY"] || 16777216;
if (TOTAL_MEMORY < TOTAL_STACK) Module.printErr("TOTAL_MEMORY should be larger than TOTAL_STACK, was " + TOTAL_MEMORY + "! (TOTAL_STACK=" + TOTAL_STACK + ")");
if (Module["buffer"]) {
 buffer = Module["buffer"];
} else {
 {
  buffer = new ArrayBuffer(TOTAL_MEMORY);
 }
}
updateGlobalBufferViews();
function getTotalMemory() {
 return TOTAL_MEMORY;
}
HEAP32[0] = 1668509029;
HEAP16[1] = 25459;
if (HEAPU8[2] !== 115 || HEAPU8[3] !== 99) throw "Runtime error: expected the system to be little-endian!";
Module["HEAP"] = HEAP;
Module["buffer"] = buffer;
Module["HEAP8"] = HEAP8;
Module["HEAP16"] = HEAP16;
Module["HEAP32"] = HEAP32;
Module["HEAPU8"] = HEAPU8;
Module["HEAPU16"] = HEAPU16;
Module["HEAPU32"] = HEAPU32;
Module["HEAPF32"] = HEAPF32;
Module["HEAPF64"] = HEAPF64;
function callRuntimeCallbacks(callbacks) {
 while (callbacks.length > 0) {
  var callback = callbacks.shift();
  if (typeof callback == "function") {
   callback();
   continue;
  }
  var func = callback.func;
  if (typeof func === "number") {
   if (callback.arg === undefined) {
    Module["dynCall_v"](func);
   } else {
    Module["dynCall_vi"](func, callback.arg);
   }
  } else {
   func(callback.arg === undefined ? null : callback.arg);
  }
 }
}
var __ATPRERUN__ = [];
var __ATINIT__ = [];
var __ATMAIN__ = [];
var __ATEXIT__ = [];
var __ATPOSTRUN__ = [];
var runtimeInitialized = false;
var runtimeExited = false;
function preRun() {
 if (Module["preRun"]) {
  if (typeof Module["preRun"] == "function") Module["preRun"] = [ Module["preRun"] ];
  while (Module["preRun"].length) {
   addOnPreRun(Module["preRun"].shift());
  }
 }
 callRuntimeCallbacks(__ATPRERUN__);
}
function ensureInitRuntime() {
 if (runtimeInitialized) return;
 runtimeInitialized = true;
 callRuntimeCallbacks(__ATINIT__);
}
function preMain() {
 callRuntimeCallbacks(__ATMAIN__);
}
function exitRuntime() {
 callRuntimeCallbacks(__ATEXIT__);
 runtimeExited = true;
}
function postRun() {
 if (Module["postRun"]) {
  if (typeof Module["postRun"] == "function") Module["postRun"] = [ Module["postRun"] ];
  while (Module["postRun"].length) {
   addOnPostRun(Module["postRun"].shift());
  }
 }
 callRuntimeCallbacks(__ATPOSTRUN__);
}
function addOnPreRun(cb) {
 __ATPRERUN__.unshift(cb);
}
Module["addOnPreRun"] = addOnPreRun;
function addOnInit(cb) {
 __ATINIT__.unshift(cb);
}
Module["addOnInit"] = addOnInit;
function addOnPreMain(cb) {
 __ATMAIN__.unshift(cb);
}
Module["addOnPreMain"] = addOnPreMain;
function addOnExit(cb) {
 __ATEXIT__.unshift(cb);
}
Module["addOnExit"] = addOnExit;
function addOnPostRun(cb) {
 __ATPOSTRUN__.unshift(cb);
}
Module["addOnPostRun"] = addOnPostRun;
function intArrayFromString(stringy, dontAddNull, length) {
 var len = length > 0 ? length : lengthBytesUTF8(stringy) + 1;
 var u8array = new Array(len);
 var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
 if (dontAddNull) u8array.length = numBytesWritten;
 return u8array;
}
Module["intArrayFromString"] = intArrayFromString;
function intArrayToString(array) {
 var ret = [];
 for (var i = 0; i < array.length; i++) {
  var chr = array[i];
  if (chr > 255) {
   chr &= 255;
  }
  ret.push(String.fromCharCode(chr));
 }
 return ret.join("");
}
Module["intArrayToString"] = intArrayToString;
function writeStringToMemory(string, buffer, dontAddNull) {
 Runtime.warnOnce("writeStringToMemory is deprecated and should not be called! Use stringToUTF8() instead!");
 var lastChar, end;
 if (dontAddNull) {
  end = buffer + lengthBytesUTF8(string);
  lastChar = HEAP8[end];
 }
 stringToUTF8(string, buffer, Infinity);
 if (dontAddNull) HEAP8[end] = lastChar;
}
Module["writeStringToMemory"] = writeStringToMemory;
function writeArrayToMemory(array, buffer) {
 HEAP8.set(array, buffer);
}
Module["writeArrayToMemory"] = writeArrayToMemory;
function writeAsciiToMemory(str, buffer, dontAddNull) {
 for (var i = 0; i < str.length; ++i) {
  HEAP8[buffer++ >> 0] = str.charCodeAt(i);
 }
 if (!dontAddNull) HEAP8[buffer >> 0] = 0;
}
Module["writeAsciiToMemory"] = writeAsciiToMemory;
if (!Math["imul"] || Math["imul"](4294967295, 5) !== -5) Math["imul"] = function imul(a, b) {
 var ah = a >>> 16;
 var al = a & 65535;
 var bh = b >>> 16;
 var bl = b & 65535;
 return al * bl + (ah * bl + al * bh << 16) | 0;
};
Math.imul = Math["imul"];
if (!Math["clz32"]) Math["clz32"] = (function(x) {
 x = x >>> 0;
 for (var i = 0; i < 32; i++) {
  if (x & 1 << 31 - i) return i;
 }
 return 32;
});
Math.clz32 = Math["clz32"];
if (!Math["trunc"]) Math["trunc"] = (function(x) {
 return x < 0 ? Math.ceil(x) : Math.floor(x);
});
Math.trunc = Math["trunc"];
var Math_abs = Math.abs;
var Math_cos = Math.cos;
var Math_sin = Math.sin;
var Math_tan = Math.tan;
var Math_acos = Math.acos;
var Math_asin = Math.asin;
var Math_atan = Math.atan;
var Math_atan2 = Math.atan2;
var Math_exp = Math.exp;
var Math_log = Math.log;
var Math_sqrt = Math.sqrt;
var Math_ceil = Math.ceil;
var Math_floor = Math.floor;
var Math_pow = Math.pow;
var Math_imul = Math.imul;
var Math_fround = Math.fround;
var Math_round = Math.round;
var Math_min = Math.min;
var Math_clz32 = Math.clz32;
var Math_trunc = Math.trunc;
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null;
function addRunDependency(id) {
 runDependencies++;
 if (Module["monitorRunDependencies"]) {
  Module["monitorRunDependencies"](runDependencies);
 }
}
Module["addRunDependency"] = addRunDependency;
function removeRunDependency(id) {
 runDependencies--;
 if (Module["monitorRunDependencies"]) {
  Module["monitorRunDependencies"](runDependencies);
 }
 if (runDependencies == 0) {
  if (runDependencyWatcher !== null) {
   clearInterval(runDependencyWatcher);
   runDependencyWatcher = null;
  }
  if (dependenciesFulfilled) {
   var callback = dependenciesFulfilled;
   dependenciesFulfilled = null;
   callback();
  }
 }
}
Module["removeRunDependency"] = removeRunDependency;
Module["preloadedImages"] = {};
Module["preloadedAudios"] = {};
var memoryInitializer = null;
var ASM_CONSTS = [];
STATIC_BASE = 8;
STATICTOP = STATIC_BASE + 5216;
__ATINIT__.push({
 func: (function() {
  __GLOBAL__sub_I_test1_cpp();
 })
}, {
 func: (function() {
  __GLOBAL__sub_I_test3_cpp();
 })
}, {
 func: (function() {
  __GLOBAL__sub_I_test4_cpp();
 })
});
memoryInitializer = "test.js.mem";
var tempDoublePtr = STATICTOP;
STATICTOP += 16;
Module["_i64Subtract"] = _i64Subtract;
Module["_i64Add"] = _i64Add;
function __ZSt18uncaught_exceptionv() {
 return !!__ZSt18uncaught_exceptionv.uncaught_exception;
}
var EXCEPTIONS = {
 last: 0,
 caught: [],
 infos: {},
 deAdjust: (function(adjusted) {
  if (!adjusted || EXCEPTIONS.infos[adjusted]) return adjusted;
  for (var ptr in EXCEPTIONS.infos) {
   var info = EXCEPTIONS.infos[ptr];
   if (info.adjusted === adjusted) {
    return ptr;
   }
  }
  return adjusted;
 }),
 addRef: (function(ptr) {
  if (!ptr) return;
  var info = EXCEPTIONS.infos[ptr];
  info.refcount++;
 }),
 decRef: (function(ptr) {
  if (!ptr) return;
  var info = EXCEPTIONS.infos[ptr];
  assert(info.refcount > 0);
  info.refcount--;
  if (info.refcount === 0 && !info.rethrown) {
   if (info.destructor) {
    Module["dynCall_vi"](info.destructor, ptr);
   }
   delete EXCEPTIONS.infos[ptr];
   ___cxa_free_exception(ptr);
  }
 }),
 clearRef: (function(ptr) {
  if (!ptr) return;
  var info = EXCEPTIONS.infos[ptr];
  info.refcount = 0;
 })
};
function ___resumeException(ptr) {
 if (!EXCEPTIONS.last) {
  EXCEPTIONS.last = ptr;
 }
 throw ptr + " - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch.";
}
function ___cxa_find_matching_catch() {
 var thrown = EXCEPTIONS.last;
 if (!thrown) {
  return (Runtime.setTempRet0(0), 0) | 0;
 }
 var info = EXCEPTIONS.infos[thrown];
 var throwntype = info.type;
 if (!throwntype) {
  return (Runtime.setTempRet0(0), thrown) | 0;
 }
 var typeArray = Array.prototype.slice.call(arguments);
 var pointer = Module["___cxa_is_pointer_type"](throwntype);
 if (!___cxa_find_matching_catch.buffer) ___cxa_find_matching_catch.buffer = _malloc(4);
 HEAP32[___cxa_find_matching_catch.buffer >> 2] = thrown;
 thrown = ___cxa_find_matching_catch.buffer;
 for (var i = 0; i < typeArray.length; i++) {
  if (typeArray[i] && Module["___cxa_can_catch"](typeArray[i], throwntype, thrown)) {
   thrown = HEAP32[thrown >> 2];
   info.adjusted = thrown;
   return (Runtime.setTempRet0(typeArray[i]), thrown) | 0;
  }
 }
 thrown = HEAP32[thrown >> 2];
 return (Runtime.setTempRet0(throwntype), thrown) | 0;
}
function ___cxa_throw(ptr, type, destructor) {
 EXCEPTIONS.infos[ptr] = {
  ptr: ptr,
  adjusted: ptr,
  type: type,
  destructor: destructor,
  refcount: 0,
  caught: false,
  rethrown: false
 };
 EXCEPTIONS.last = ptr;
 if (!("uncaught_exception" in __ZSt18uncaught_exceptionv)) {
  __ZSt18uncaught_exceptionv.uncaught_exception = 1;
 } else {
  __ZSt18uncaught_exceptionv.uncaught_exception++;
 }
 throw ptr + " - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch.";
}
Module["_memset"] = _memset;
function _pthread_cleanup_push(routine, arg) {
 __ATEXIT__.push((function() {
  Module["dynCall_vi"](routine, arg);
 }));
 _pthread_cleanup_push.level = __ATEXIT__.length;
}
Module["_bitshift64Lshr"] = _bitshift64Lshr;
Module["_bitshift64Shl"] = _bitshift64Shl;
function _pthread_cleanup_pop() {
 assert(_pthread_cleanup_push.level == __ATEXIT__.length, "cannot pop if something else added meanwhile!");
 __ATEXIT__.pop();
 _pthread_cleanup_push.level = __ATEXIT__.length;
}
function _abort() {
 Module["abort"]();
}
function ___cxa_begin_catch(ptr) {
 var info = EXCEPTIONS.infos[ptr];
 if (info && !info.caught) {
  info.caught = true;
  __ZSt18uncaught_exceptionv.uncaught_exception--;
 }
 if (info) info.rethrown = false;
 EXCEPTIONS.caught.push(ptr);
 EXCEPTIONS.addRef(EXCEPTIONS.deAdjust(ptr));
 return ptr;
}
function _pthread_once(ptr, func) {
 if (!_pthread_once.seen) _pthread_once.seen = {};
 if (ptr in _pthread_once.seen) return;
 Module["dynCall_v"](func);
 _pthread_once.seen[ptr] = 1;
}
function ___lock() {}
function ___unlock() {}
var SYSCALLS = {
 varargs: 0,
 get: (function(varargs) {
  SYSCALLS.varargs += 4;
  var ret = HEAP32[SYSCALLS.varargs - 4 >> 2];
  return ret;
 }),
 getStr: (function() {
  var ret = Pointer_stringify(SYSCALLS.get());
  return ret;
 }),
 get64: (function() {
  var low = SYSCALLS.get(), high = SYSCALLS.get();
  if (low >= 0) assert(high === 0); else assert(high === -1);
  return low;
 }),
 getZero: (function() {
  assert(SYSCALLS.get() === 0);
 })
};
function ___syscall6(which, varargs) {
 SYSCALLS.varargs = varargs;
 try {
  var stream = SYSCALLS.getStreamFromFD();
  FS.close(stream);
  return 0;
 } catch (e) {
  if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
  return -e.errno;
 }
}
var cttz_i8 = allocate([ 8, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 4, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 5, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 4, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 6, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 4, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 5, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 4, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 7, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 4, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 5, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 4, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 6, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 4, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 5, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 4, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0 ], "i8", ALLOC_STATIC);
Module["_llvm_cttz_i32"] = _llvm_cttz_i32;
Module["___udivmoddi4"] = ___udivmoddi4;
Module["___udivdi3"] = ___udivdi3;
var PTHREAD_SPECIFIC = {};
function _pthread_getspecific(key) {
 return PTHREAD_SPECIFIC[key] || 0;
}
function ___setErrNo(value) {
 if (Module["___errno_location"]) HEAP32[Module["___errno_location"]() >> 2] = value;
 return value;
}
Module["_sbrk"] = _sbrk;
var PTHREAD_SPECIFIC_NEXT_KEY = 1;
var ERRNO_CODES = {
 EPERM: 1,
 ENOENT: 2,
 ESRCH: 3,
 EINTR: 4,
 EIO: 5,
 ENXIO: 6,
 E2BIG: 7,
 ENOEXEC: 8,
 EBADF: 9,
 ECHILD: 10,
 EAGAIN: 11,
 EWOULDBLOCK: 11,
 ENOMEM: 12,
 EACCES: 13,
 EFAULT: 14,
 ENOTBLK: 15,
 EBUSY: 16,
 EEXIST: 17,
 EXDEV: 18,
 ENODEV: 19,
 ENOTDIR: 20,
 EISDIR: 21,
 EINVAL: 22,
 ENFILE: 23,
 EMFILE: 24,
 ENOTTY: 25,
 ETXTBSY: 26,
 EFBIG: 27,
 ENOSPC: 28,
 ESPIPE: 29,
 EROFS: 30,
 EMLINK: 31,
 EPIPE: 32,
 EDOM: 33,
 ERANGE: 34,
 ENOMSG: 42,
 EIDRM: 43,
 ECHRNG: 44,
 EL2NSYNC: 45,
 EL3HLT: 46,
 EL3RST: 47,
 ELNRNG: 48,
 EUNATCH: 49,
 ENOCSI: 50,
 EL2HLT: 51,
 EDEADLK: 35,
 ENOLCK: 37,
 EBADE: 52,
 EBADR: 53,
 EXFULL: 54,
 ENOANO: 55,
 EBADRQC: 56,
 EBADSLT: 57,
 EDEADLOCK: 35,
 EBFONT: 59,
 ENOSTR: 60,
 ENODATA: 61,
 ETIME: 62,
 ENOSR: 63,
 ENONET: 64,
 ENOPKG: 65,
 EREMOTE: 66,
 ENOLINK: 67,
 EADV: 68,
 ESRMNT: 69,
 ECOMM: 70,
 EPROTO: 71,
 EMULTIHOP: 72,
 EDOTDOT: 73,
 EBADMSG: 74,
 ENOTUNIQ: 76,
 EBADFD: 77,
 EREMCHG: 78,
 ELIBACC: 79,
 ELIBBAD: 80,
 ELIBSCN: 81,
 ELIBMAX: 82,
 ELIBEXEC: 83,
 ENOSYS: 38,
 ENOTEMPTY: 39,
 ENAMETOOLONG: 36,
 ELOOP: 40,
 EOPNOTSUPP: 95,
 EPFNOSUPPORT: 96,
 ECONNRESET: 104,
 ENOBUFS: 105,
 EAFNOSUPPORT: 97,
 EPROTOTYPE: 91,
 ENOTSOCK: 88,
 ENOPROTOOPT: 92,
 ESHUTDOWN: 108,
 ECONNREFUSED: 111,
 EADDRINUSE: 98,
 ECONNABORTED: 103,
 ENETUNREACH: 101,
 ENETDOWN: 100,
 ETIMEDOUT: 110,
 EHOSTDOWN: 112,
 EHOSTUNREACH: 113,
 EINPROGRESS: 115,
 EALREADY: 114,
 EDESTADDRREQ: 89,
 EMSGSIZE: 90,
 EPROTONOSUPPORT: 93,
 ESOCKTNOSUPPORT: 94,
 EADDRNOTAVAIL: 99,
 ENETRESET: 102,
 EISCONN: 106,
 ENOTCONN: 107,
 ETOOMANYREFS: 109,
 EUSERS: 87,
 EDQUOT: 122,
 ESTALE: 116,
 ENOTSUP: 95,
 ENOMEDIUM: 123,
 EILSEQ: 84,
 EOVERFLOW: 75,
 ECANCELED: 125,
 ENOTRECOVERABLE: 131,
 EOWNERDEAD: 130,
 ESTRPIPE: 86
};
function _pthread_key_create(key, destructor) {
 if (key == 0) {
  return ERRNO_CODES.EINVAL;
 }
 HEAP32[key >> 2] = PTHREAD_SPECIFIC_NEXT_KEY;
 PTHREAD_SPECIFIC[PTHREAD_SPECIFIC_NEXT_KEY] = 0;
 PTHREAD_SPECIFIC_NEXT_KEY++;
 return 0;
}
function ___gxx_personality_v0() {}
Module["___uremdi3"] = ___uremdi3;
function _emscripten_memcpy_big(dest, src, num) {
 HEAPU8.set(HEAPU8.subarray(src, src + num), dest);
 return dest;
}
Module["_memcpy"] = _memcpy;
function ___syscall146(which, varargs) {
 SYSCALLS.varargs = varargs;
 try {
  var stream = SYSCALLS.get(), iov = SYSCALLS.get(), iovcnt = SYSCALLS.get();
  var ret = 0;
  if (!___syscall146.buffer) {
   ___syscall146.buffers = [ null, [], [] ];
   ___syscall146.printChar = (function(stream, curr) {
    var buffer = ___syscall146.buffers[stream];
    assert(buffer);
    if (curr === 0 || curr === 10) {
     (stream === 1 ? Module["print"] : Module["printErr"])(UTF8ArrayToString(buffer, 0));
     buffer.length = 0;
    } else {
     buffer.push(curr);
    }
   });
  }
  for (var i = 0; i < iovcnt; i++) {
   var ptr = HEAP32[iov + i * 8 >> 2];
   var len = HEAP32[iov + (i * 8 + 4) >> 2];
   for (var j = 0; j < len; j++) {
    ___syscall146.printChar(stream, HEAPU8[ptr + j]);
   }
   ret += len;
  }
  return ret;
 } catch (e) {
  if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
  return -e.errno;
 }
}
function _pthread_setspecific(key, value) {
 if (!(key in PTHREAD_SPECIFIC)) {
  return ERRNO_CODES.EINVAL;
 }
 PTHREAD_SPECIFIC[key] = value;
 return 0;
}
Module["_pthread_self"] = _pthread_self;
function ___syscall140(which, varargs) {
 SYSCALLS.varargs = varargs;
 try {
  var stream = SYSCALLS.getStreamFromFD(), offset_high = SYSCALLS.get(), offset_low = SYSCALLS.get(), result = SYSCALLS.get(), whence = SYSCALLS.get();
  var offset = offset_low;
  assert(offset_high === 0);
  FS.llseek(stream, offset, whence);
  HEAP32[result >> 2] = stream.position;
  if (stream.getdents && offset === 0 && whence === 0) stream.getdents = null;
  return 0;
 } catch (e) {
  if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
  return -e.errno;
 }
}
function _malloc(bytes) {
 var ptr = Runtime.dynamicAlloc(bytes + 8);
 return ptr + 8 & 4294967288;
}
Module["_malloc"] = _malloc;
function ___cxa_allocate_exception(size) {
 return _malloc(size);
}
function ___syscall54(which, varargs) {
 SYSCALLS.varargs = varargs;
 try {
  return 0;
 } catch (e) {
  if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
  return -e.errno;
 }
}
__ATEXIT__.push((function() {
 var fflush = Module["_fflush"];
 if (fflush) fflush(0);
 var printChar = ___syscall146.printChar;
 if (!printChar) return;
 var buffers = ___syscall146.buffers;
 if (buffers[1].length) printChar(1, 10);
 if (buffers[2].length) printChar(2, 10);
}));
DYNAMICTOP_PTR = allocate(1, "i32", ALLOC_STATIC);
STACK_BASE = STACKTOP = Runtime.alignMemory(STATICTOP);
STACK_MAX = STACK_BASE + TOTAL_STACK;
DYNAMIC_BASE = Runtime.alignMemory(STACK_MAX);
HEAP32[DYNAMICTOP_PTR >> 2] = DYNAMIC_BASE;
staticSealed = true;
function invoke_iiii(index, a1, a2, a3) {
 try {
  return Module["dynCall_iiii"](index, a1, a2, a3);
 } catch (e) {
  if (typeof e !== "number" && e !== "longjmp") throw e;
  Module["setThrew"](1, 0);
 }
}
function invoke_viiiii(index, a1, a2, a3, a4, a5) {
 try {
  Module["dynCall_viiiii"](index, a1, a2, a3, a4, a5);
 } catch (e) {
  if (typeof e !== "number" && e !== "longjmp") throw e;
  Module["setThrew"](1, 0);
 }
}
function invoke_vi(index, a1) {
 try {
  Module["dynCall_vi"](index, a1);
 } catch (e) {
  if (typeof e !== "number" && e !== "longjmp") throw e;
  Module["setThrew"](1, 0);
 }
}
function invoke_ii(index, a1) {
 try {
  return Module["dynCall_ii"](index, a1);
 } catch (e) {
  if (typeof e !== "number" && e !== "longjmp") throw e;
  Module["setThrew"](1, 0);
 }
}
function invoke_v(index) {
 try {
  Module["dynCall_v"](index);
 } catch (e) {
  if (typeof e !== "number" && e !== "longjmp") throw e;
  Module["setThrew"](1, 0);
 }
}
function invoke_viiiiii(index, a1, a2, a3, a4, a5, a6) {
 try {
  Module["dynCall_viiiiii"](index, a1, a2, a3, a4, a5, a6);
 } catch (e) {
  if (typeof e !== "number" && e !== "longjmp") throw e;
  Module["setThrew"](1, 0);
 }
}
function invoke_viiii(index, a1, a2, a3, a4) {
 try {
  Module["dynCall_viiii"](index, a1, a2, a3, a4);
 } catch (e) {
  if (typeof e !== "number" && e !== "longjmp") throw e;
  Module["setThrew"](1, 0);
 }
}
Module.asmGlobalArg = {
 "Math": Math,
 "Int8Array": Int8Array,
 "Int16Array": Int16Array,
 "Int32Array": Int32Array,
 "Uint8Array": Uint8Array,
 "Uint16Array": Uint16Array,
 "Uint32Array": Uint32Array,
 "Float32Array": Float32Array,
 "Float64Array": Float64Array,
 "NaN": NaN,
 "Infinity": Infinity
};
Module.asmLibraryArg = {
 "abort": abort,
 "assert": assert,
 "enlargeMemory": enlargeMemory,
 "getTotalMemory": getTotalMemory,
 "abortOnCannotGrowMemory": abortOnCannotGrowMemory,
 "invoke_iiii": invoke_iiii,
 "invoke_viiiii": invoke_viiiii,
 "invoke_vi": invoke_vi,
 "invoke_ii": invoke_ii,
 "invoke_v": invoke_v,
 "invoke_viiiiii": invoke_viiiiii,
 "invoke_viiii": invoke_viiii,
 "_pthread_cleanup_pop": _pthread_cleanup_pop,
 "_pthread_key_create": _pthread_key_create,
 "___syscall6": ___syscall6,
 "___gxx_personality_v0": ___gxx_personality_v0,
 "___cxa_allocate_exception": ___cxa_allocate_exception,
 "___cxa_find_matching_catch": ___cxa_find_matching_catch,
 "___setErrNo": ___setErrNo,
 "___cxa_begin_catch": ___cxa_begin_catch,
 "_emscripten_memcpy_big": _emscripten_memcpy_big,
 "___resumeException": ___resumeException,
 "__ZSt18uncaught_exceptionv": __ZSt18uncaught_exceptionv,
 "_pthread_getspecific": _pthread_getspecific,
 "_pthread_once": _pthread_once,
 "___syscall54": ___syscall54,
 "___unlock": ___unlock,
 "_pthread_setspecific": _pthread_setspecific,
 "___cxa_throw": ___cxa_throw,
 "___lock": ___lock,
 "_abort": _abort,
 "_pthread_cleanup_push": _pthread_cleanup_push,
 "___syscall140": ___syscall140,
 "___syscall146": ___syscall146,
 "DYNAMICTOP_PTR": DYNAMICTOP_PTR,
 "tempDoublePtr": tempDoublePtr,
 "ABORT": ABORT,
 "STACKTOP": STACKTOP,
 "STACK_MAX": STACK_MAX,
 "cttz_i8": cttz_i8
};
// EMSCRIPTEN_START_ASM

var asm = (function(global,env,buffer) {

  'use asm';
  
  
  var HEAP8 = new global.Int8Array(buffer);
  var HEAP16 = new global.Int16Array(buffer);
  var HEAP32 = new global.Int32Array(buffer);
  var HEAPU8 = new global.Uint8Array(buffer);
  var HEAPU16 = new global.Uint16Array(buffer);
  var HEAPU32 = new global.Uint32Array(buffer);
  var HEAPF32 = new global.Float32Array(buffer);
  var HEAPF64 = new global.Float64Array(buffer);


  var DYNAMICTOP_PTR=env.DYNAMICTOP_PTR|0;
  var tempDoublePtr=env.tempDoublePtr|0;
  var ABORT=env.ABORT|0;
  var STACKTOP=env.STACKTOP|0;
  var STACK_MAX=env.STACK_MAX|0;
  var cttz_i8=env.cttz_i8|0;

  var __THREW__ = 0;
  var threwValue = 0;
  var setjmpId = 0;
  var undef = 0;
  var nan = global.NaN, inf = global.Infinity;
  var tempInt = 0, tempBigInt = 0, tempBigIntP = 0, tempBigIntS = 0, tempBigIntR = 0.0, tempBigIntI = 0, tempBigIntD = 0, tempValue = 0, tempDouble = 0.0;
  var tempRet0 = 0;

  var Math_floor=global.Math.floor;
  var Math_abs=global.Math.abs;
  var Math_sqrt=global.Math.sqrt;
  var Math_pow=global.Math.pow;
  var Math_cos=global.Math.cos;
  var Math_sin=global.Math.sin;
  var Math_tan=global.Math.tan;
  var Math_acos=global.Math.acos;
  var Math_asin=global.Math.asin;
  var Math_atan=global.Math.atan;
  var Math_atan2=global.Math.atan2;
  var Math_exp=global.Math.exp;
  var Math_log=global.Math.log;
  var Math_ceil=global.Math.ceil;
  var Math_imul=global.Math.imul;
  var Math_min=global.Math.min;
  var Math_max=global.Math.max;
  var Math_clz32=global.Math.clz32;
  var abort=env.abort;
  var assert=env.assert;
  var enlargeMemory=env.enlargeMemory;
  var getTotalMemory=env.getTotalMemory;
  var abortOnCannotGrowMemory=env.abortOnCannotGrowMemory;
  var invoke_iiii=env.invoke_iiii;
  var invoke_viiiii=env.invoke_viiiii;
  var invoke_vi=env.invoke_vi;
  var invoke_ii=env.invoke_ii;
  var invoke_v=env.invoke_v;
  var invoke_viiiiii=env.invoke_viiiiii;
  var invoke_viiii=env.invoke_viiii;
  var _pthread_cleanup_pop=env._pthread_cleanup_pop;
  var _pthread_key_create=env._pthread_key_create;
  var ___syscall6=env.___syscall6;
  var ___gxx_personality_v0=env.___gxx_personality_v0;
  var ___cxa_allocate_exception=env.___cxa_allocate_exception;
  var ___cxa_find_matching_catch=env.___cxa_find_matching_catch;
  var ___setErrNo=env.___setErrNo;
  var ___cxa_begin_catch=env.___cxa_begin_catch;
  var _emscripten_memcpy_big=env._emscripten_memcpy_big;
  var ___resumeException=env.___resumeException;
  var __ZSt18uncaught_exceptionv=env.__ZSt18uncaught_exceptionv;
  var _pthread_getspecific=env._pthread_getspecific;
  var _pthread_once=env._pthread_once;
  var ___syscall54=env.___syscall54;
  var ___unlock=env.___unlock;
  var _pthread_setspecific=env._pthread_setspecific;
  var ___cxa_throw=env.___cxa_throw;
  var ___lock=env.___lock;
  var _abort=env._abort;
  var _pthread_cleanup_push=env._pthread_cleanup_push;
  var ___syscall140=env.___syscall140;
  var ___syscall146=env.___syscall146;
  var tempFloat = 0.0;

// EMSCRIPTEN_START_FUNCS

function _malloc(i2) {
 i2 = i2 | 0;
 var i1 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, i20 = 0, i21 = 0, i22 = 0, i23 = 0, i24 = 0, i25 = 0, i26 = 0, i27 = 0, i28 = 0, i29 = 0, i30 = 0, i31 = 0, i32 = 0, i33 = 0, i34 = 0, i35 = 0, i36 = 0;
 i36 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 i14 = i36;
 do if (i2 >>> 0 < 245) {
  i13 = i2 >>> 0 < 11 ? 16 : i2 + 11 & -8;
  i2 = i13 >>> 3;
  i18 = HEAP32[918] | 0;
  i3 = i18 >>> i2;
  if (i3 & 3 | 0) {
   i2 = (i3 & 1 ^ 1) + i2 | 0;
   i3 = 3712 + (i2 << 1 << 2) | 0;
   i4 = i3 + 8 | 0;
   i5 = HEAP32[i4 >> 2] | 0;
   i6 = i5 + 8 | 0;
   i7 = HEAP32[i6 >> 2] | 0;
   do if ((i3 | 0) != (i7 | 0)) {
    if (i7 >>> 0 < (HEAP32[922] | 0) >>> 0) _abort();
    i1 = i7 + 12 | 0;
    if ((HEAP32[i1 >> 2] | 0) == (i5 | 0)) {
     HEAP32[i1 >> 2] = i3;
     HEAP32[i4 >> 2] = i7;
     break;
    } else _abort();
   } else HEAP32[918] = i18 & ~(1 << i2); while (0);
   i35 = i2 << 3;
   HEAP32[i5 + 4 >> 2] = i35 | 3;
   i35 = i5 + i35 + 4 | 0;
   HEAP32[i35 >> 2] = HEAP32[i35 >> 2] | 1;
   i35 = i6;
   STACKTOP = i36;
   return i35 | 0;
  }
  i17 = HEAP32[920] | 0;
  if (i13 >>> 0 > i17 >>> 0) {
   if (i3 | 0) {
    i8 = 2 << i2;
    i2 = i3 << i2 & (i8 | 0 - i8);
    i2 = (i2 & 0 - i2) + -1 | 0;
    i8 = i2 >>> 12 & 16;
    i2 = i2 >>> i8;
    i4 = i2 >>> 5 & 8;
    i2 = i2 >>> i4;
    i6 = i2 >>> 2 & 4;
    i2 = i2 >>> i6;
    i3 = i2 >>> 1 & 2;
    i2 = i2 >>> i3;
    i1 = i2 >>> 1 & 1;
    i1 = (i4 | i8 | i6 | i3 | i1) + (i2 >>> i1) | 0;
    i2 = 3712 + (i1 << 1 << 2) | 0;
    i3 = i2 + 8 | 0;
    i6 = HEAP32[i3 >> 2] | 0;
    i8 = i6 + 8 | 0;
    i4 = HEAP32[i8 >> 2] | 0;
    do if ((i2 | 0) != (i4 | 0)) {
     if (i4 >>> 0 < (HEAP32[922] | 0) >>> 0) _abort();
     i5 = i4 + 12 | 0;
     if ((HEAP32[i5 >> 2] | 0) == (i6 | 0)) {
      HEAP32[i5 >> 2] = i2;
      HEAP32[i3 >> 2] = i4;
      i9 = i18;
      break;
     } else _abort();
    } else {
     i9 = i18 & ~(1 << i1);
     HEAP32[918] = i9;
    } while (0);
    i7 = (i1 << 3) - i13 | 0;
    HEAP32[i6 + 4 >> 2] = i13 | 3;
    i4 = i6 + i13 | 0;
    HEAP32[i4 + 4 >> 2] = i7 | 1;
    HEAP32[i4 + i7 >> 2] = i7;
    if (i17 | 0) {
     i5 = HEAP32[923] | 0;
     i1 = i17 >>> 3;
     i3 = 3712 + (i1 << 1 << 2) | 0;
     i1 = 1 << i1;
     if (i9 & i1) {
      i1 = i3 + 8 | 0;
      i2 = HEAP32[i1 >> 2] | 0;
      if (i2 >>> 0 < (HEAP32[922] | 0) >>> 0) _abort(); else {
       i10 = i2;
       i11 = i1;
      }
     } else {
      HEAP32[918] = i9 | i1;
      i10 = i3;
      i11 = i3 + 8 | 0;
     }
     HEAP32[i11 >> 2] = i5;
     HEAP32[i10 + 12 >> 2] = i5;
     HEAP32[i5 + 8 >> 2] = i10;
     HEAP32[i5 + 12 >> 2] = i3;
    }
    HEAP32[920] = i7;
    HEAP32[923] = i4;
    i35 = i8;
    STACKTOP = i36;
    return i35 | 0;
   }
   i10 = HEAP32[919] | 0;
   if (i10) {
    i2 = (i10 & 0 - i10) + -1 | 0;
    i34 = i2 >>> 12 & 16;
    i2 = i2 >>> i34;
    i33 = i2 >>> 5 & 8;
    i2 = i2 >>> i33;
    i35 = i2 >>> 2 & 4;
    i2 = i2 >>> i35;
    i8 = i2 >>> 1 & 2;
    i2 = i2 >>> i8;
    i9 = i2 >>> 1 & 1;
    i9 = HEAP32[3976 + ((i33 | i34 | i35 | i8 | i9) + (i2 >>> i9) << 2) >> 2] | 0;
    i2 = i9;
    i8 = i9;
    i9 = (HEAP32[i9 + 4 >> 2] & -8) - i13 | 0;
    while (1) {
     i1 = HEAP32[i2 + 16 >> 2] | 0;
     if (!i1) {
      i1 = HEAP32[i2 + 20 >> 2] | 0;
      if (!i1) break;
     }
     i35 = (HEAP32[i1 + 4 >> 2] & -8) - i13 | 0;
     i34 = i35 >>> 0 < i9 >>> 0;
     i2 = i1;
     i8 = i34 ? i1 : i8;
     i9 = i34 ? i35 : i9;
    }
    i5 = HEAP32[922] | 0;
    if (i8 >>> 0 < i5 >>> 0) _abort();
    i7 = i8 + i13 | 0;
    if (i8 >>> 0 >= i7 >>> 0) _abort();
    i6 = HEAP32[i8 + 24 >> 2] | 0;
    i3 = HEAP32[i8 + 12 >> 2] | 0;
    do if ((i3 | 0) == (i8 | 0)) {
     i2 = i8 + 20 | 0;
     i1 = HEAP32[i2 >> 2] | 0;
     if (!i1) {
      i2 = i8 + 16 | 0;
      i1 = HEAP32[i2 >> 2] | 0;
      if (!i1) {
       i12 = 0;
       break;
      }
     }
     while (1) {
      i3 = i1 + 20 | 0;
      i4 = HEAP32[i3 >> 2] | 0;
      if (i4 | 0) {
       i1 = i4;
       i2 = i3;
       continue;
      }
      i3 = i1 + 16 | 0;
      i4 = HEAP32[i3 >> 2] | 0;
      if (!i4) break; else {
       i1 = i4;
       i2 = i3;
      }
     }
     if (i2 >>> 0 < i5 >>> 0) _abort(); else {
      HEAP32[i2 >> 2] = 0;
      i12 = i1;
      break;
     }
    } else {
     i4 = HEAP32[i8 + 8 >> 2] | 0;
     if (i4 >>> 0 < i5 >>> 0) _abort();
     i1 = i4 + 12 | 0;
     if ((HEAP32[i1 >> 2] | 0) != (i8 | 0)) _abort();
     i2 = i3 + 8 | 0;
     if ((HEAP32[i2 >> 2] | 0) == (i8 | 0)) {
      HEAP32[i1 >> 2] = i3;
      HEAP32[i2 >> 2] = i4;
      i12 = i3;
      break;
     } else _abort();
    } while (0);
    do if (i6 | 0) {
     i1 = HEAP32[i8 + 28 >> 2] | 0;
     i2 = 3976 + (i1 << 2) | 0;
     if ((i8 | 0) == (HEAP32[i2 >> 2] | 0)) {
      HEAP32[i2 >> 2] = i12;
      if (!i12) {
       HEAP32[919] = i10 & ~(1 << i1);
       break;
      }
     } else {
      if (i6 >>> 0 < (HEAP32[922] | 0) >>> 0) _abort();
      i1 = i6 + 16 | 0;
      if ((HEAP32[i1 >> 2] | 0) == (i8 | 0)) HEAP32[i1 >> 2] = i12; else HEAP32[i6 + 20 >> 2] = i12;
      if (!i12) break;
     }
     i2 = HEAP32[922] | 0;
     if (i12 >>> 0 < i2 >>> 0) _abort();
     HEAP32[i12 + 24 >> 2] = i6;
     i1 = HEAP32[i8 + 16 >> 2] | 0;
     do if (i1 | 0) if (i1 >>> 0 < i2 >>> 0) _abort(); else {
      HEAP32[i12 + 16 >> 2] = i1;
      HEAP32[i1 + 24 >> 2] = i12;
      break;
     } while (0);
     i1 = HEAP32[i8 + 20 >> 2] | 0;
     if (i1 | 0) if (i1 >>> 0 < (HEAP32[922] | 0) >>> 0) _abort(); else {
      HEAP32[i12 + 20 >> 2] = i1;
      HEAP32[i1 + 24 >> 2] = i12;
      break;
     }
    } while (0);
    if (i9 >>> 0 < 16) {
     i35 = i9 + i13 | 0;
     HEAP32[i8 + 4 >> 2] = i35 | 3;
     i35 = i8 + i35 + 4 | 0;
     HEAP32[i35 >> 2] = HEAP32[i35 >> 2] | 1;
    } else {
     HEAP32[i8 + 4 >> 2] = i13 | 3;
     HEAP32[i7 + 4 >> 2] = i9 | 1;
     HEAP32[i7 + i9 >> 2] = i9;
     if (i17 | 0) {
      i4 = HEAP32[923] | 0;
      i1 = i17 >>> 3;
      i3 = 3712 + (i1 << 1 << 2) | 0;
      i1 = 1 << i1;
      if (i18 & i1) {
       i1 = i3 + 8 | 0;
       i2 = HEAP32[i1 >> 2] | 0;
       if (i2 >>> 0 < (HEAP32[922] | 0) >>> 0) _abort(); else {
        i15 = i2;
        i16 = i1;
       }
      } else {
       HEAP32[918] = i18 | i1;
       i15 = i3;
       i16 = i3 + 8 | 0;
      }
      HEAP32[i16 >> 2] = i4;
      HEAP32[i15 + 12 >> 2] = i4;
      HEAP32[i4 + 8 >> 2] = i15;
      HEAP32[i4 + 12 >> 2] = i3;
     }
     HEAP32[920] = i9;
     HEAP32[923] = i7;
    }
    i35 = i8 + 8 | 0;
    STACKTOP = i36;
    return i35 | 0;
   }
  }
 } else if (i2 >>> 0 <= 4294967231) {
  i2 = i2 + 11 | 0;
  i13 = i2 & -8;
  i10 = HEAP32[919] | 0;
  if (i10) {
   i4 = 0 - i13 | 0;
   i2 = i2 >>> 8;
   if (i2) if (i13 >>> 0 > 16777215) i9 = 31; else {
    i16 = (i2 + 1048320 | 0) >>> 16 & 8;
    i28 = i2 << i16;
    i15 = (i28 + 520192 | 0) >>> 16 & 4;
    i28 = i28 << i15;
    i9 = (i28 + 245760 | 0) >>> 16 & 2;
    i9 = 14 - (i15 | i16 | i9) + (i28 << i9 >>> 15) | 0;
    i9 = i13 >>> (i9 + 7 | 0) & 1 | i9 << 1;
   } else i9 = 0;
   i2 = HEAP32[3976 + (i9 << 2) >> 2] | 0;
   L123 : do if (!i2) {
    i3 = 0;
    i5 = 0;
    i28 = 86;
   } else {
    i5 = 0;
    i8 = i2;
    i7 = i13 << ((i9 | 0) == 31 ? 0 : 25 - (i9 >>> 1) | 0);
    i3 = 0;
    while (1) {
     i2 = (HEAP32[i8 + 4 >> 2] & -8) - i13 | 0;
     if (i2 >>> 0 < i4 >>> 0) if (!i2) {
      i2 = i8;
      i4 = 0;
      i3 = i8;
      i28 = 90;
      break L123;
     } else {
      i5 = i8;
      i4 = i2;
     }
     i2 = HEAP32[i8 + 20 >> 2] | 0;
     i8 = HEAP32[i8 + 16 + (i7 >>> 31 << 2) >> 2] | 0;
     i3 = (i2 | 0) == 0 | (i2 | 0) == (i8 | 0) ? i3 : i2;
     i2 = (i8 | 0) == 0;
     if (i2) {
      i28 = 86;
      break;
     } else i7 = i7 << (i2 & 1 ^ 1);
    }
   } while (0);
   if ((i28 | 0) == 86) {
    if ((i3 | 0) == 0 & (i5 | 0) == 0) {
     i2 = 2 << i9;
     i2 = i10 & (i2 | 0 - i2);
     if (!i2) break;
     i16 = (i2 & 0 - i2) + -1 | 0;
     i11 = i16 >>> 12 & 16;
     i16 = i16 >>> i11;
     i9 = i16 >>> 5 & 8;
     i16 = i16 >>> i9;
     i12 = i16 >>> 2 & 4;
     i16 = i16 >>> i12;
     i15 = i16 >>> 1 & 2;
     i16 = i16 >>> i15;
     i3 = i16 >>> 1 & 1;
     i3 = HEAP32[3976 + ((i9 | i11 | i12 | i15 | i3) + (i16 >>> i3) << 2) >> 2] | 0;
    }
    if (!i3) {
     i9 = i5;
     i8 = i4;
    } else {
     i2 = i5;
     i28 = 90;
    }
   }
   if ((i28 | 0) == 90) while (1) {
    i28 = 0;
    i16 = (HEAP32[i3 + 4 >> 2] & -8) - i13 | 0;
    i5 = i16 >>> 0 < i4 >>> 0;
    i4 = i5 ? i16 : i4;
    i2 = i5 ? i3 : i2;
    i5 = HEAP32[i3 + 16 >> 2] | 0;
    if (i5 | 0) {
     i3 = i5;
     i28 = 90;
     continue;
    }
    i3 = HEAP32[i3 + 20 >> 2] | 0;
    if (!i3) {
     i9 = i2;
     i8 = i4;
     break;
    } else i28 = 90;
   }
   if ((i9 | 0) != 0 ? i8 >>> 0 < ((HEAP32[920] | 0) - i13 | 0) >>> 0 : 0) {
    i5 = HEAP32[922] | 0;
    if (i9 >>> 0 < i5 >>> 0) _abort();
    i7 = i9 + i13 | 0;
    if (i9 >>> 0 >= i7 >>> 0) _abort();
    i6 = HEAP32[i9 + 24 >> 2] | 0;
    i3 = HEAP32[i9 + 12 >> 2] | 0;
    do if ((i3 | 0) == (i9 | 0)) {
     i2 = i9 + 20 | 0;
     i1 = HEAP32[i2 >> 2] | 0;
     if (!i1) {
      i2 = i9 + 16 | 0;
      i1 = HEAP32[i2 >> 2] | 0;
      if (!i1) {
       i17 = 0;
       break;
      }
     }
     while (1) {
      i3 = i1 + 20 | 0;
      i4 = HEAP32[i3 >> 2] | 0;
      if (i4 | 0) {
       i1 = i4;
       i2 = i3;
       continue;
      }
      i3 = i1 + 16 | 0;
      i4 = HEAP32[i3 >> 2] | 0;
      if (!i4) break; else {
       i1 = i4;
       i2 = i3;
      }
     }
     if (i2 >>> 0 < i5 >>> 0) _abort(); else {
      HEAP32[i2 >> 2] = 0;
      i17 = i1;
      break;
     }
    } else {
     i4 = HEAP32[i9 + 8 >> 2] | 0;
     if (i4 >>> 0 < i5 >>> 0) _abort();
     i1 = i4 + 12 | 0;
     if ((HEAP32[i1 >> 2] | 0) != (i9 | 0)) _abort();
     i2 = i3 + 8 | 0;
     if ((HEAP32[i2 >> 2] | 0) == (i9 | 0)) {
      HEAP32[i1 >> 2] = i3;
      HEAP32[i2 >> 2] = i4;
      i17 = i3;
      break;
     } else _abort();
    } while (0);
    do if (i6) {
     i1 = HEAP32[i9 + 28 >> 2] | 0;
     i2 = 3976 + (i1 << 2) | 0;
     if ((i9 | 0) == (HEAP32[i2 >> 2] | 0)) {
      HEAP32[i2 >> 2] = i17;
      if (!i17) {
       i18 = i10 & ~(1 << i1);
       HEAP32[919] = i18;
       break;
      }
     } else {
      if (i6 >>> 0 < (HEAP32[922] | 0) >>> 0) _abort();
      i1 = i6 + 16 | 0;
      if ((HEAP32[i1 >> 2] | 0) == (i9 | 0)) HEAP32[i1 >> 2] = i17; else HEAP32[i6 + 20 >> 2] = i17;
      if (!i17) {
       i18 = i10;
       break;
      }
     }
     i2 = HEAP32[922] | 0;
     if (i17 >>> 0 < i2 >>> 0) _abort();
     HEAP32[i17 + 24 >> 2] = i6;
     i1 = HEAP32[i9 + 16 >> 2] | 0;
     do if (i1 | 0) if (i1 >>> 0 < i2 >>> 0) _abort(); else {
      HEAP32[i17 + 16 >> 2] = i1;
      HEAP32[i1 + 24 >> 2] = i17;
      break;
     } while (0);
     i1 = HEAP32[i9 + 20 >> 2] | 0;
     if (i1) if (i1 >>> 0 < (HEAP32[922] | 0) >>> 0) _abort(); else {
      HEAP32[i17 + 20 >> 2] = i1;
      HEAP32[i1 + 24 >> 2] = i17;
      i18 = i10;
      break;
     } else i18 = i10;
    } else i18 = i10; while (0);
    do if (i8 >>> 0 >= 16) {
     HEAP32[i9 + 4 >> 2] = i13 | 3;
     HEAP32[i7 + 4 >> 2] = i8 | 1;
     HEAP32[i7 + i8 >> 2] = i8;
     i1 = i8 >>> 3;
     if (i8 >>> 0 < 256) {
      i3 = 3712 + (i1 << 1 << 2) | 0;
      i2 = HEAP32[918] | 0;
      i1 = 1 << i1;
      if (i2 & i1) {
       i1 = i3 + 8 | 0;
       i2 = HEAP32[i1 >> 2] | 0;
       if (i2 >>> 0 < (HEAP32[922] | 0) >>> 0) _abort(); else {
        i26 = i2;
        i27 = i1;
       }
      } else {
       HEAP32[918] = i2 | i1;
       i26 = i3;
       i27 = i3 + 8 | 0;
      }
      HEAP32[i27 >> 2] = i7;
      HEAP32[i26 + 12 >> 2] = i7;
      HEAP32[i7 + 8 >> 2] = i26;
      HEAP32[i7 + 12 >> 2] = i3;
      break;
     }
     i1 = i8 >>> 8;
     if (i1) if (i8 >>> 0 > 16777215) i1 = 31; else {
      i34 = (i1 + 1048320 | 0) >>> 16 & 8;
      i35 = i1 << i34;
      i33 = (i35 + 520192 | 0) >>> 16 & 4;
      i35 = i35 << i33;
      i1 = (i35 + 245760 | 0) >>> 16 & 2;
      i1 = 14 - (i33 | i34 | i1) + (i35 << i1 >>> 15) | 0;
      i1 = i8 >>> (i1 + 7 | 0) & 1 | i1 << 1;
     } else i1 = 0;
     i3 = 3976 + (i1 << 2) | 0;
     HEAP32[i7 + 28 >> 2] = i1;
     i2 = i7 + 16 | 0;
     HEAP32[i2 + 4 >> 2] = 0;
     HEAP32[i2 >> 2] = 0;
     i2 = 1 << i1;
     if (!(i18 & i2)) {
      HEAP32[919] = i18 | i2;
      HEAP32[i3 >> 2] = i7;
      HEAP32[i7 + 24 >> 2] = i3;
      HEAP32[i7 + 12 >> 2] = i7;
      HEAP32[i7 + 8 >> 2] = i7;
      break;
     }
     i2 = i8 << ((i1 | 0) == 31 ? 0 : 25 - (i1 >>> 1) | 0);
     i4 = HEAP32[i3 >> 2] | 0;
     while (1) {
      if ((HEAP32[i4 + 4 >> 2] & -8 | 0) == (i8 | 0)) {
       i28 = 148;
       break;
      }
      i3 = i4 + 16 + (i2 >>> 31 << 2) | 0;
      i1 = HEAP32[i3 >> 2] | 0;
      if (!i1) {
       i28 = 145;
       break;
      } else {
       i2 = i2 << 1;
       i4 = i1;
      }
     }
     if ((i28 | 0) == 145) if (i3 >>> 0 < (HEAP32[922] | 0) >>> 0) _abort(); else {
      HEAP32[i3 >> 2] = i7;
      HEAP32[i7 + 24 >> 2] = i4;
      HEAP32[i7 + 12 >> 2] = i7;
      HEAP32[i7 + 8 >> 2] = i7;
      break;
     } else if ((i28 | 0) == 148) {
      i1 = i4 + 8 | 0;
      i2 = HEAP32[i1 >> 2] | 0;
      i35 = HEAP32[922] | 0;
      if (i2 >>> 0 >= i35 >>> 0 & i4 >>> 0 >= i35 >>> 0) {
       HEAP32[i2 + 12 >> 2] = i7;
       HEAP32[i1 >> 2] = i7;
       HEAP32[i7 + 8 >> 2] = i2;
       HEAP32[i7 + 12 >> 2] = i4;
       HEAP32[i7 + 24 >> 2] = 0;
       break;
      } else _abort();
     }
    } else {
     i35 = i8 + i13 | 0;
     HEAP32[i9 + 4 >> 2] = i35 | 3;
     i35 = i9 + i35 + 4 | 0;
     HEAP32[i35 >> 2] = HEAP32[i35 >> 2] | 1;
    } while (0);
    i35 = i9 + 8 | 0;
    STACKTOP = i36;
    return i35 | 0;
   }
  }
 } else i13 = -1; while (0);
 i3 = HEAP32[920] | 0;
 if (i3 >>> 0 >= i13 >>> 0) {
  i1 = i3 - i13 | 0;
  i2 = HEAP32[923] | 0;
  if (i1 >>> 0 > 15) {
   i35 = i2 + i13 | 0;
   HEAP32[923] = i35;
   HEAP32[920] = i1;
   HEAP32[i35 + 4 >> 2] = i1 | 1;
   HEAP32[i35 + i1 >> 2] = i1;
   HEAP32[i2 + 4 >> 2] = i13 | 3;
  } else {
   HEAP32[920] = 0;
   HEAP32[923] = 0;
   HEAP32[i2 + 4 >> 2] = i3 | 3;
   i35 = i2 + i3 + 4 | 0;
   HEAP32[i35 >> 2] = HEAP32[i35 >> 2] | 1;
  }
  i35 = i2 + 8 | 0;
  STACKTOP = i36;
  return i35 | 0;
 }
 i8 = HEAP32[921] | 0;
 if (i8 >>> 0 > i13 >>> 0) {
  i33 = i8 - i13 | 0;
  HEAP32[921] = i33;
  i35 = HEAP32[924] | 0;
  i34 = i35 + i13 | 0;
  HEAP32[924] = i34;
  HEAP32[i34 + 4 >> 2] = i33 | 1;
  HEAP32[i35 + 4 >> 2] = i13 | 3;
  i35 = i35 + 8 | 0;
  STACKTOP = i36;
  return i35 | 0;
 }
 if (!(HEAP32[1036] | 0)) {
  HEAP32[1038] = 4096;
  HEAP32[1037] = 4096;
  HEAP32[1039] = -1;
  HEAP32[1040] = -1;
  HEAP32[1041] = 0;
  HEAP32[1029] = 0;
  i2 = i14 & -16 ^ 1431655768;
  HEAP32[i14 >> 2] = i2;
  HEAP32[1036] = i2;
  i2 = 4096;
 } else i2 = HEAP32[1038] | 0;
 i9 = i13 + 48 | 0;
 i10 = i13 + 47 | 0;
 i7 = i2 + i10 | 0;
 i5 = 0 - i2 | 0;
 i11 = i7 & i5;
 if (i11 >>> 0 <= i13 >>> 0) {
  i35 = 0;
  STACKTOP = i36;
  return i35 | 0;
 }
 i2 = HEAP32[1028] | 0;
 if (i2 | 0 ? (i26 = HEAP32[1026] | 0, i27 = i26 + i11 | 0, i27 >>> 0 <= i26 >>> 0 | i27 >>> 0 > i2 >>> 0) : 0) {
  i35 = 0;
  STACKTOP = i36;
  return i35 | 0;
 }
 L255 : do if (!(HEAP32[1029] & 4)) {
  i3 = HEAP32[924] | 0;
  L257 : do if (i3) {
   i4 = 4120;
   while (1) {
    i2 = HEAP32[i4 >> 2] | 0;
    if (i2 >>> 0 <= i3 >>> 0 ? (i19 = i4 + 4 | 0, (i2 + (HEAP32[i19 >> 2] | 0) | 0) >>> 0 > i3 >>> 0) : 0) break;
    i2 = HEAP32[i4 + 8 >> 2] | 0;
    if (!i2) {
     i28 = 172;
     break L257;
    } else i4 = i2;
   }
   i3 = i7 - i8 & i5;
   if (i3 >>> 0 < 2147483647) {
    i2 = _sbrk(i3 | 0) | 0;
    if ((i2 | 0) == ((HEAP32[i4 >> 2] | 0) + (HEAP32[i19 >> 2] | 0) | 0)) {
     if ((i2 | 0) != (-1 | 0)) {
      i7 = i3;
      i6 = i2;
      i28 = 190;
      break L255;
     }
    } else {
     i1 = i3;
     i28 = 180;
    }
   }
  } else i28 = 172; while (0);
  do if (((i28 | 0) == 172 ? (i6 = _sbrk(0) | 0, (i6 | 0) != (-1 | 0)) : 0) ? (i1 = i6, i20 = HEAP32[1037] | 0, i21 = i20 + -1 | 0, i1 = ((i21 & i1 | 0) == 0 ? 0 : (i21 + i1 & 0 - i20) - i1 | 0) + i11 | 0, i20 = HEAP32[1026] | 0, i21 = i1 + i20 | 0, i1 >>> 0 > i13 >>> 0 & i1 >>> 0 < 2147483647) : 0) {
   i27 = HEAP32[1028] | 0;
   if (i27 | 0 ? i21 >>> 0 <= i20 >>> 0 | i21 >>> 0 > i27 >>> 0 : 0) break;
   i2 = _sbrk(i1 | 0) | 0;
   if ((i2 | 0) == (i6 | 0)) {
    i7 = i1;
    i28 = 190;
    break L255;
   } else i28 = 180;
  } while (0);
  L274 : do if ((i28 | 0) == 180) {
   i3 = 0 - i1 | 0;
   do if (i9 >>> 0 > i1 >>> 0 & (i1 >>> 0 < 2147483647 & (i2 | 0) != (-1 | 0)) ? (i22 = HEAP32[1038] | 0, i22 = i10 - i1 + i22 & 0 - i22, i22 >>> 0 < 2147483647) : 0) if ((_sbrk(i22 | 0) | 0) == (-1 | 0)) {
    _sbrk(i3 | 0) | 0;
    break L274;
   } else {
    i1 = i22 + i1 | 0;
    break;
   } while (0);
   if ((i2 | 0) != (-1 | 0)) {
    i7 = i1;
    i6 = i2;
    i28 = 190;
    break L255;
   }
  } while (0);
  HEAP32[1029] = HEAP32[1029] | 4;
  i28 = 187;
 } else i28 = 187; while (0);
 if ((((i28 | 0) == 187 ? i11 >>> 0 < 2147483647 : 0) ? (i25 = _sbrk(i11 | 0) | 0, i23 = _sbrk(0) | 0, i25 >>> 0 < i23 >>> 0 & ((i25 | 0) != (-1 | 0) & (i23 | 0) != (-1 | 0))) : 0) ? (i24 = i23 - i25 | 0, i24 >>> 0 > (i13 + 40 | 0) >>> 0) : 0) {
  i7 = i24;
  i6 = i25;
  i28 = 190;
 }
 if ((i28 | 0) == 190) {
  i1 = (HEAP32[1026] | 0) + i7 | 0;
  HEAP32[1026] = i1;
  if (i1 >>> 0 > (HEAP32[1027] | 0) >>> 0) HEAP32[1027] = i1;
  i10 = HEAP32[924] | 0;
  do if (i10) {
   i1 = 4120;
   while (1) {
    i2 = HEAP32[i1 >> 2] | 0;
    i3 = i1 + 4 | 0;
    i4 = HEAP32[i3 >> 2] | 0;
    if ((i6 | 0) == (i2 + i4 | 0)) {
     i28 = 200;
     break;
    }
    i5 = HEAP32[i1 + 8 >> 2] | 0;
    if (!i5) break; else i1 = i5;
   }
   if (((i28 | 0) == 200 ? (HEAP32[i1 + 12 >> 2] & 8 | 0) == 0 : 0) ? i10 >>> 0 < i6 >>> 0 & i10 >>> 0 >= i2 >>> 0 : 0) {
    HEAP32[i3 >> 2] = i4 + i7;
    i35 = i10 + 8 | 0;
    i35 = (i35 & 7 | 0) == 0 ? 0 : 0 - i35 & 7;
    i34 = i10 + i35 | 0;
    i35 = i7 - i35 + (HEAP32[921] | 0) | 0;
    HEAP32[924] = i34;
    HEAP32[921] = i35;
    HEAP32[i34 + 4 >> 2] = i35 | 1;
    HEAP32[i34 + i35 + 4 >> 2] = 40;
    HEAP32[925] = HEAP32[1040];
    break;
   }
   i1 = HEAP32[922] | 0;
   if (i6 >>> 0 < i1 >>> 0) {
    HEAP32[922] = i6;
    i8 = i6;
   } else i8 = i1;
   i2 = i6 + i7 | 0;
   i1 = 4120;
   while (1) {
    if ((HEAP32[i1 >> 2] | 0) == (i2 | 0)) {
     i28 = 208;
     break;
    }
    i1 = HEAP32[i1 + 8 >> 2] | 0;
    if (!i1) {
     i2 = 4120;
     break;
    }
   }
   if ((i28 | 0) == 208) if (!(HEAP32[i1 + 12 >> 2] & 8)) {
    HEAP32[i1 >> 2] = i6;
    i12 = i1 + 4 | 0;
    HEAP32[i12 >> 2] = (HEAP32[i12 >> 2] | 0) + i7;
    i12 = i6 + 8 | 0;
    i12 = i6 + ((i12 & 7 | 0) == 0 ? 0 : 0 - i12 & 7) | 0;
    i1 = i2 + 8 | 0;
    i1 = i2 + ((i1 & 7 | 0) == 0 ? 0 : 0 - i1 & 7) | 0;
    i11 = i12 + i13 | 0;
    i9 = i1 - i12 - i13 | 0;
    HEAP32[i12 + 4 >> 2] = i13 | 3;
    do if ((i1 | 0) != (i10 | 0)) {
     if ((i1 | 0) == (HEAP32[923] | 0)) {
      i35 = (HEAP32[920] | 0) + i9 | 0;
      HEAP32[920] = i35;
      HEAP32[923] = i11;
      HEAP32[i11 + 4 >> 2] = i35 | 1;
      HEAP32[i11 + i35 >> 2] = i35;
      break;
     }
     i2 = HEAP32[i1 + 4 >> 2] | 0;
     if ((i2 & 3 | 0) == 1) {
      i7 = i2 & -8;
      i5 = i2 >>> 3;
      L326 : do if (i2 >>> 0 >= 256) {
       i6 = HEAP32[i1 + 24 >> 2] | 0;
       i4 = HEAP32[i1 + 12 >> 2] | 0;
       do if ((i4 | 0) == (i1 | 0)) {
        i4 = i1 + 16 | 0;
        i3 = i4 + 4 | 0;
        i2 = HEAP32[i3 >> 2] | 0;
        if (!i2) {
         i2 = HEAP32[i4 >> 2] | 0;
         if (!i2) {
          i33 = 0;
          break;
         } else i3 = i4;
        }
        while (1) {
         i4 = i2 + 20 | 0;
         i5 = HEAP32[i4 >> 2] | 0;
         if (i5 | 0) {
          i2 = i5;
          i3 = i4;
          continue;
         }
         i4 = i2 + 16 | 0;
         i5 = HEAP32[i4 >> 2] | 0;
         if (!i5) break; else {
          i2 = i5;
          i3 = i4;
         }
        }
        if (i3 >>> 0 < i8 >>> 0) _abort(); else {
         HEAP32[i3 >> 2] = 0;
         i33 = i2;
         break;
        }
       } else {
        i5 = HEAP32[i1 + 8 >> 2] | 0;
        if (i5 >>> 0 < i8 >>> 0) _abort();
        i2 = i5 + 12 | 0;
        if ((HEAP32[i2 >> 2] | 0) != (i1 | 0)) _abort();
        i3 = i4 + 8 | 0;
        if ((HEAP32[i3 >> 2] | 0) == (i1 | 0)) {
         HEAP32[i2 >> 2] = i4;
         HEAP32[i3 >> 2] = i5;
         i33 = i4;
         break;
        } else _abort();
       } while (0);
       if (!i6) break;
       i2 = HEAP32[i1 + 28 >> 2] | 0;
       i3 = 3976 + (i2 << 2) | 0;
       do if ((i1 | 0) != (HEAP32[i3 >> 2] | 0)) {
        if (i6 >>> 0 < (HEAP32[922] | 0) >>> 0) _abort();
        i2 = i6 + 16 | 0;
        if ((HEAP32[i2 >> 2] | 0) == (i1 | 0)) HEAP32[i2 >> 2] = i33; else HEAP32[i6 + 20 >> 2] = i33;
        if (!i33) break L326;
       } else {
        HEAP32[i3 >> 2] = i33;
        if (i33 | 0) break;
        HEAP32[919] = HEAP32[919] & ~(1 << i2);
        break L326;
       } while (0);
       i4 = HEAP32[922] | 0;
       if (i33 >>> 0 < i4 >>> 0) _abort();
       HEAP32[i33 + 24 >> 2] = i6;
       i2 = i1 + 16 | 0;
       i3 = HEAP32[i2 >> 2] | 0;
       do if (i3 | 0) if (i3 >>> 0 < i4 >>> 0) _abort(); else {
        HEAP32[i33 + 16 >> 2] = i3;
        HEAP32[i3 + 24 >> 2] = i33;
        break;
       } while (0);
       i2 = HEAP32[i2 + 4 >> 2] | 0;
       if (!i2) break;
       if (i2 >>> 0 < (HEAP32[922] | 0) >>> 0) _abort(); else {
        HEAP32[i33 + 20 >> 2] = i2;
        HEAP32[i2 + 24 >> 2] = i33;
        break;
       }
      } else {
       i3 = HEAP32[i1 + 8 >> 2] | 0;
       i4 = HEAP32[i1 + 12 >> 2] | 0;
       i2 = 3712 + (i5 << 1 << 2) | 0;
       do if ((i3 | 0) != (i2 | 0)) {
        if (i3 >>> 0 < i8 >>> 0) _abort();
        if ((HEAP32[i3 + 12 >> 2] | 0) == (i1 | 0)) break;
        _abort();
       } while (0);
       if ((i4 | 0) == (i3 | 0)) {
        HEAP32[918] = HEAP32[918] & ~(1 << i5);
        break;
       }
       do if ((i4 | 0) == (i2 | 0)) i30 = i4 + 8 | 0; else {
        if (i4 >>> 0 < i8 >>> 0) _abort();
        i2 = i4 + 8 | 0;
        if ((HEAP32[i2 >> 2] | 0) == (i1 | 0)) {
         i30 = i2;
         break;
        }
        _abort();
       } while (0);
       HEAP32[i3 + 12 >> 2] = i4;
       HEAP32[i30 >> 2] = i3;
      } while (0);
      i1 = i1 + i7 | 0;
      i5 = i7 + i9 | 0;
     } else i5 = i9;
     i1 = i1 + 4 | 0;
     HEAP32[i1 >> 2] = HEAP32[i1 >> 2] & -2;
     HEAP32[i11 + 4 >> 2] = i5 | 1;
     HEAP32[i11 + i5 >> 2] = i5;
     i1 = i5 >>> 3;
     if (i5 >>> 0 < 256) {
      i3 = 3712 + (i1 << 1 << 2) | 0;
      i2 = HEAP32[918] | 0;
      i1 = 1 << i1;
      do if (!(i2 & i1)) {
       HEAP32[918] = i2 | i1;
       i34 = i3;
       i35 = i3 + 8 | 0;
      } else {
       i1 = i3 + 8 | 0;
       i2 = HEAP32[i1 >> 2] | 0;
       if (i2 >>> 0 >= (HEAP32[922] | 0) >>> 0) {
        i34 = i2;
        i35 = i1;
        break;
       }
       _abort();
      } while (0);
      HEAP32[i35 >> 2] = i11;
      HEAP32[i34 + 12 >> 2] = i11;
      HEAP32[i11 + 8 >> 2] = i34;
      HEAP32[i11 + 12 >> 2] = i3;
      break;
     }
     i1 = i5 >>> 8;
     do if (!i1) i1 = 0; else {
      if (i5 >>> 0 > 16777215) {
       i1 = 31;
       break;
      }
      i34 = (i1 + 1048320 | 0) >>> 16 & 8;
      i35 = i1 << i34;
      i33 = (i35 + 520192 | 0) >>> 16 & 4;
      i35 = i35 << i33;
      i1 = (i35 + 245760 | 0) >>> 16 & 2;
      i1 = 14 - (i33 | i34 | i1) + (i35 << i1 >>> 15) | 0;
      i1 = i5 >>> (i1 + 7 | 0) & 1 | i1 << 1;
     } while (0);
     i4 = 3976 + (i1 << 2) | 0;
     HEAP32[i11 + 28 >> 2] = i1;
     i2 = i11 + 16 | 0;
     HEAP32[i2 + 4 >> 2] = 0;
     HEAP32[i2 >> 2] = 0;
     i2 = HEAP32[919] | 0;
     i3 = 1 << i1;
     if (!(i2 & i3)) {
      HEAP32[919] = i2 | i3;
      HEAP32[i4 >> 2] = i11;
      HEAP32[i11 + 24 >> 2] = i4;
      HEAP32[i11 + 12 >> 2] = i11;
      HEAP32[i11 + 8 >> 2] = i11;
      break;
     }
     i2 = i5 << ((i1 | 0) == 31 ? 0 : 25 - (i1 >>> 1) | 0);
     i4 = HEAP32[i4 >> 2] | 0;
     while (1) {
      if ((HEAP32[i4 + 4 >> 2] & -8 | 0) == (i5 | 0)) {
       i28 = 278;
       break;
      }
      i3 = i4 + 16 + (i2 >>> 31 << 2) | 0;
      i1 = HEAP32[i3 >> 2] | 0;
      if (!i1) {
       i28 = 275;
       break;
      } else {
       i2 = i2 << 1;
       i4 = i1;
      }
     }
     if ((i28 | 0) == 275) if (i3 >>> 0 < (HEAP32[922] | 0) >>> 0) _abort(); else {
      HEAP32[i3 >> 2] = i11;
      HEAP32[i11 + 24 >> 2] = i4;
      HEAP32[i11 + 12 >> 2] = i11;
      HEAP32[i11 + 8 >> 2] = i11;
      break;
     } else if ((i28 | 0) == 278) {
      i1 = i4 + 8 | 0;
      i2 = HEAP32[i1 >> 2] | 0;
      i35 = HEAP32[922] | 0;
      if (i2 >>> 0 >= i35 >>> 0 & i4 >>> 0 >= i35 >>> 0) {
       HEAP32[i2 + 12 >> 2] = i11;
       HEAP32[i1 >> 2] = i11;
       HEAP32[i11 + 8 >> 2] = i2;
       HEAP32[i11 + 12 >> 2] = i4;
       HEAP32[i11 + 24 >> 2] = 0;
       break;
      } else _abort();
     }
    } else {
     i35 = (HEAP32[921] | 0) + i9 | 0;
     HEAP32[921] = i35;
     HEAP32[924] = i11;
     HEAP32[i11 + 4 >> 2] = i35 | 1;
    } while (0);
    i35 = i12 + 8 | 0;
    STACKTOP = i36;
    return i35 | 0;
   } else i2 = 4120;
   while (1) {
    i1 = HEAP32[i2 >> 2] | 0;
    if (i1 >>> 0 <= i10 >>> 0 ? (i29 = i1 + (HEAP32[i2 + 4 >> 2] | 0) | 0, i29 >>> 0 > i10 >>> 0) : 0) break;
    i2 = HEAP32[i2 + 8 >> 2] | 0;
   }
   i5 = i29 + -47 | 0;
   i2 = i5 + 8 | 0;
   i2 = i5 + ((i2 & 7 | 0) == 0 ? 0 : 0 - i2 & 7) | 0;
   i5 = i10 + 16 | 0;
   i2 = i2 >>> 0 < i5 >>> 0 ? i10 : i2;
   i1 = i2 + 8 | 0;
   i3 = i6 + 8 | 0;
   i3 = (i3 & 7 | 0) == 0 ? 0 : 0 - i3 & 7;
   i35 = i6 + i3 | 0;
   i3 = i7 + -40 - i3 | 0;
   HEAP32[924] = i35;
   HEAP32[921] = i3;
   HEAP32[i35 + 4 >> 2] = i3 | 1;
   HEAP32[i35 + i3 + 4 >> 2] = 40;
   HEAP32[925] = HEAP32[1040];
   i3 = i2 + 4 | 0;
   HEAP32[i3 >> 2] = 27;
   HEAP32[i1 >> 2] = HEAP32[1030];
   HEAP32[i1 + 4 >> 2] = HEAP32[1031];
   HEAP32[i1 + 8 >> 2] = HEAP32[1032];
   HEAP32[i1 + 12 >> 2] = HEAP32[1033];
   HEAP32[1030] = i6;
   HEAP32[1031] = i7;
   HEAP32[1033] = 0;
   HEAP32[1032] = i1;
   i1 = i2 + 24 | 0;
   do {
    i1 = i1 + 4 | 0;
    HEAP32[i1 >> 2] = 7;
   } while ((i1 + 4 | 0) >>> 0 < i29 >>> 0);
   if ((i2 | 0) != (i10 | 0)) {
    i6 = i2 - i10 | 0;
    HEAP32[i3 >> 2] = HEAP32[i3 >> 2] & -2;
    HEAP32[i10 + 4 >> 2] = i6 | 1;
    HEAP32[i2 >> 2] = i6;
    i1 = i6 >>> 3;
    if (i6 >>> 0 < 256) {
     i3 = 3712 + (i1 << 1 << 2) | 0;
     i2 = HEAP32[918] | 0;
     i1 = 1 << i1;
     if (i2 & i1) {
      i1 = i3 + 8 | 0;
      i2 = HEAP32[i1 >> 2] | 0;
      if (i2 >>> 0 < (HEAP32[922] | 0) >>> 0) _abort(); else {
       i31 = i2;
       i32 = i1;
      }
     } else {
      HEAP32[918] = i2 | i1;
      i31 = i3;
      i32 = i3 + 8 | 0;
     }
     HEAP32[i32 >> 2] = i10;
     HEAP32[i31 + 12 >> 2] = i10;
     HEAP32[i10 + 8 >> 2] = i31;
     HEAP32[i10 + 12 >> 2] = i3;
     break;
    }
    i1 = i6 >>> 8;
    if (i1) if (i6 >>> 0 > 16777215) i3 = 31; else {
     i34 = (i1 + 1048320 | 0) >>> 16 & 8;
     i35 = i1 << i34;
     i33 = (i35 + 520192 | 0) >>> 16 & 4;
     i35 = i35 << i33;
     i3 = (i35 + 245760 | 0) >>> 16 & 2;
     i3 = 14 - (i33 | i34 | i3) + (i35 << i3 >>> 15) | 0;
     i3 = i6 >>> (i3 + 7 | 0) & 1 | i3 << 1;
    } else i3 = 0;
    i4 = 3976 + (i3 << 2) | 0;
    HEAP32[i10 + 28 >> 2] = i3;
    HEAP32[i10 + 20 >> 2] = 0;
    HEAP32[i5 >> 2] = 0;
    i1 = HEAP32[919] | 0;
    i2 = 1 << i3;
    if (!(i1 & i2)) {
     HEAP32[919] = i1 | i2;
     HEAP32[i4 >> 2] = i10;
     HEAP32[i10 + 24 >> 2] = i4;
     HEAP32[i10 + 12 >> 2] = i10;
     HEAP32[i10 + 8 >> 2] = i10;
     break;
    }
    i2 = i6 << ((i3 | 0) == 31 ? 0 : 25 - (i3 >>> 1) | 0);
    i4 = HEAP32[i4 >> 2] | 0;
    while (1) {
     if ((HEAP32[i4 + 4 >> 2] & -8 | 0) == (i6 | 0)) {
      i28 = 304;
      break;
     }
     i3 = i4 + 16 + (i2 >>> 31 << 2) | 0;
     i1 = HEAP32[i3 >> 2] | 0;
     if (!i1) {
      i28 = 301;
      break;
     } else {
      i2 = i2 << 1;
      i4 = i1;
     }
    }
    if ((i28 | 0) == 301) if (i3 >>> 0 < (HEAP32[922] | 0) >>> 0) _abort(); else {
     HEAP32[i3 >> 2] = i10;
     HEAP32[i10 + 24 >> 2] = i4;
     HEAP32[i10 + 12 >> 2] = i10;
     HEAP32[i10 + 8 >> 2] = i10;
     break;
    } else if ((i28 | 0) == 304) {
     i1 = i4 + 8 | 0;
     i2 = HEAP32[i1 >> 2] | 0;
     i35 = HEAP32[922] | 0;
     if (i2 >>> 0 >= i35 >>> 0 & i4 >>> 0 >= i35 >>> 0) {
      HEAP32[i2 + 12 >> 2] = i10;
      HEAP32[i1 >> 2] = i10;
      HEAP32[i10 + 8 >> 2] = i2;
      HEAP32[i10 + 12 >> 2] = i4;
      HEAP32[i10 + 24 >> 2] = 0;
      break;
     } else _abort();
    }
   }
  } else {
   i35 = HEAP32[922] | 0;
   if ((i35 | 0) == 0 | i6 >>> 0 < i35 >>> 0) HEAP32[922] = i6;
   HEAP32[1030] = i6;
   HEAP32[1031] = i7;
   HEAP32[1033] = 0;
   HEAP32[927] = HEAP32[1036];
   HEAP32[926] = -1;
   i1 = 0;
   do {
    i35 = 3712 + (i1 << 1 << 2) | 0;
    HEAP32[i35 + 12 >> 2] = i35;
    HEAP32[i35 + 8 >> 2] = i35;
    i1 = i1 + 1 | 0;
   } while ((i1 | 0) != 32);
   i35 = i6 + 8 | 0;
   i35 = (i35 & 7 | 0) == 0 ? 0 : 0 - i35 & 7;
   i34 = i6 + i35 | 0;
   i35 = i7 + -40 - i35 | 0;
   HEAP32[924] = i34;
   HEAP32[921] = i35;
   HEAP32[i34 + 4 >> 2] = i35 | 1;
   HEAP32[i34 + i35 + 4 >> 2] = 40;
   HEAP32[925] = HEAP32[1040];
  } while (0);
  i1 = HEAP32[921] | 0;
  if (i1 >>> 0 > i13 >>> 0) {
   i33 = i1 - i13 | 0;
   HEAP32[921] = i33;
   i35 = HEAP32[924] | 0;
   i34 = i35 + i13 | 0;
   HEAP32[924] = i34;
   HEAP32[i34 + 4 >> 2] = i33 | 1;
   HEAP32[i35 + 4 >> 2] = i13 | 3;
   i35 = i35 + 8 | 0;
   STACKTOP = i36;
   return i35 | 0;
  }
 }
 HEAP32[(___errno_location() | 0) >> 2] = 12;
 i35 = 0;
 STACKTOP = i36;
 return i35 | 0;
}

function _printf_core(i28, i3, i52, i53, i54) {
 i28 = i28 | 0;
 i3 = i3 | 0;
 i52 = i52 | 0;
 i53 = i53 | 0;
 i54 = i54 | 0;
 var i1 = 0, i2 = 0, i4 = 0, i5 = 0, d6 = 0.0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, d11 = 0.0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, i20 = 0, i21 = 0, i22 = 0, i23 = 0, i24 = 0, i25 = 0, i26 = 0, i27 = 0, i29 = 0, i30 = 0, i31 = 0, i32 = 0, i33 = 0, i34 = 0, i35 = 0, i36 = 0, i37 = 0, i38 = 0, i39 = 0, i40 = 0, i41 = 0, i42 = 0, i43 = 0, i44 = 0, i45 = 0, i46 = 0, i47 = 0, i48 = 0, i49 = 0, i50 = 0, i51 = 0, i55 = 0;
 i55 = STACKTOP;
 STACKTOP = STACKTOP + 624 | 0;
 i48 = i55 + 24 | 0;
 i49 = i55 + 16 | 0;
 i50 = i55 + 588 | 0;
 i39 = i55 + 576 | 0;
 i51 = i55;
 i34 = i55 + 536 | 0;
 i29 = i55 + 8 | 0;
 i30 = i55 + 528 | 0;
 i31 = (i28 | 0) != 0;
 i32 = i34 + 40 | 0;
 i33 = i32;
 i34 = i34 + 39 | 0;
 i35 = i29 + 4 | 0;
 i36 = i50;
 i37 = 0 - i36 | 0;
 i38 = i39 + 12 | 0;
 i39 = i39 + 11 | 0;
 i40 = i38;
 i41 = i40 - i36 | 0;
 i42 = -2 - i36 | 0;
 i43 = i40 + 2 | 0;
 i44 = i48 + 288 | 0;
 i45 = i50 + 9 | 0;
 i46 = i45;
 i47 = i50 + 8 | 0;
 i2 = 0;
 i1 = 0;
 i8 = 0;
 L1 : while (1) {
  do if ((i1 | 0) > -1) if ((i2 | 0) > (2147483647 - i1 | 0)) {
   HEAP32[(___errno_location() | 0) >> 2] = 75;
   i1 = -1;
   break;
  } else {
   i1 = i2 + i1 | 0;
   break;
  } while (0);
  i2 = HEAP8[i3 >> 0] | 0;
  if (!(i2 << 24 >> 24)) {
   i27 = 243;
   break;
  } else i4 = i3;
  L9 : while (1) {
   switch (i2 << 24 >> 24) {
   case 37:
    {
     i2 = i4;
     i27 = 9;
     break L9;
    }
   case 0:
    {
     i2 = i4;
     break L9;
    }
   default:
    {}
   }
   i2 = i4 + 1 | 0;
   i4 = i2;
   i2 = HEAP8[i2 >> 0] | 0;
  }
  L12 : do if ((i27 | 0) == 9) while (1) {
   i27 = 0;
   if ((HEAP8[i4 + 1 >> 0] | 0) != 37) break L12;
   i2 = i2 + 1 | 0;
   i4 = i4 + 2 | 0;
   if ((HEAP8[i4 >> 0] | 0) == 37) i27 = 9; else break;
  } while (0);
  i2 = i2 - i3 | 0;
  if (i31 ? (HEAP32[i28 >> 2] & 32 | 0) == 0 : 0) ___fwritex(i3, i2, i28) | 0;
  if (i2 | 0) {
   i3 = i4;
   continue;
  }
  i7 = i4 + 1 | 0;
  i5 = HEAP8[i7 >> 0] | 0;
  i2 = (i5 << 24 >> 24) + -48 | 0;
  if (i2 >>> 0 < 10) {
   i10 = (HEAP8[i4 + 2 >> 0] | 0) == 36;
   i7 = i10 ? i4 + 3 | 0 : i7;
   i12 = i10 ? i2 : -1;
   i10 = i10 ? 1 : i8;
   i2 = HEAP8[i7 >> 0] | 0;
  } else {
   i12 = -1;
   i10 = i8;
   i2 = i5;
  }
  i4 = (i2 << 24 >> 24) + -32 | 0;
  L25 : do if (i4 >>> 0 < 32) {
   i5 = 0;
   do {
    if (!(1 << i4 & 75913)) break L25;
    i5 = 1 << (i2 << 24 >> 24) + -32 | i5;
    i7 = i7 + 1 | 0;
    i2 = HEAP8[i7 >> 0] | 0;
    i4 = (i2 << 24 >> 24) + -32 | 0;
   } while (i4 >>> 0 < 32);
  } else i5 = 0; while (0);
  do if (i2 << 24 >> 24 != 42) {
   i4 = (i2 << 24 >> 24) + -48 | 0;
   if (i4 >>> 0 < 10) {
    i8 = 0;
    do {
     i8 = (i8 * 10 | 0) + i4 | 0;
     i7 = i7 + 1 | 0;
     i2 = HEAP8[i7 >> 0] | 0;
     i4 = (i2 << 24 >> 24) + -48 | 0;
    } while (i4 >>> 0 < 10);
    if ((i8 | 0) < 0) {
     i1 = -1;
     break L1;
    } else i26 = i10;
   } else {
    i8 = 0;
    i26 = i10;
   }
  } else {
   i9 = i7 + 1 | 0;
   i2 = HEAP8[i9 >> 0] | 0;
   i4 = (i2 << 24 >> 24) + -48 | 0;
   if (i4 >>> 0 < 10 ? (HEAP8[i7 + 2 >> 0] | 0) == 36 : 0) {
    HEAP32[i54 + (i4 << 2) >> 2] = 10;
    i2 = HEAP32[i53 + ((HEAP8[i9 >> 0] | 0) + -48 << 3) >> 2] | 0;
    i4 = 1;
    i9 = i7 + 3 | 0;
   } else {
    if (i10 | 0) {
     i1 = -1;
     break L1;
    }
    if (!i31) {
     i8 = 0;
     i26 = 0;
     i7 = i9;
     break;
    }
    i4 = (HEAP32[i52 >> 2] | 0) + (4 - 1) & ~(4 - 1);
    i2 = HEAP32[i4 >> 2] | 0;
    HEAP32[i52 >> 2] = i4 + 4;
    i4 = 0;
   }
   i26 = (i2 | 0) < 0;
   i8 = i26 ? 0 - i2 | 0 : i2;
   i5 = i26 ? i5 | 8192 : i5;
   i26 = i4;
   i7 = i9;
   i2 = HEAP8[i9 >> 0] | 0;
  } while (0);
  L45 : do if (i2 << 24 >> 24 == 46) {
   i2 = i7 + 1 | 0;
   i4 = HEAP8[i2 >> 0] | 0;
   if (i4 << 24 >> 24 != 42) {
    i7 = (i4 << 24 >> 24) + -48 | 0;
    if (i7 >>> 0 < 10) i4 = 0; else {
     i13 = 0;
     break;
    }
    while (1) {
     i4 = (i4 * 10 | 0) + i7 | 0;
     i2 = i2 + 1 | 0;
     i7 = (HEAP8[i2 >> 0] | 0) + -48 | 0;
     if (i7 >>> 0 >= 10) {
      i13 = i4;
      break L45;
     }
    }
   }
   i2 = i7 + 2 | 0;
   i4 = (HEAP8[i2 >> 0] | 0) + -48 | 0;
   if (i4 >>> 0 < 10 ? (HEAP8[i7 + 3 >> 0] | 0) == 36 : 0) {
    HEAP32[i54 + (i4 << 2) >> 2] = 10;
    i13 = HEAP32[i53 + ((HEAP8[i2 >> 0] | 0) + -48 << 3) >> 2] | 0;
    i2 = i7 + 4 | 0;
    break;
   }
   if (i26 | 0) {
    i1 = -1;
    break L1;
   }
   if (i31) {
    i25 = (HEAP32[i52 >> 2] | 0) + (4 - 1) & ~(4 - 1);
    i13 = HEAP32[i25 >> 2] | 0;
    HEAP32[i52 >> 2] = i25 + 4;
   } else i13 = 0;
  } else {
   i13 = -1;
   i2 = i7;
  } while (0);
  i10 = 0;
  while (1) {
   i4 = (HEAP8[i2 >> 0] | 0) + -65 | 0;
   if (i4 >>> 0 > 57) {
    i1 = -1;
    break L1;
   }
   i25 = i2 + 1 | 0;
   i4 = HEAP8[577 + (i10 * 58 | 0) + i4 >> 0] | 0;
   i7 = i4 & 255;
   if ((i7 + -1 | 0) >>> 0 < 8) {
    i10 = i7;
    i2 = i25;
   } else break;
  }
  if (!(i4 << 24 >> 24)) {
   i1 = -1;
   break;
  }
  i9 = (i12 | 0) > -1;
  do if (i4 << 24 >> 24 == 19) if (i9) {
   i1 = -1;
   break L1;
  } else i27 = 51; else {
   if (i9) {
    HEAP32[i54 + (i12 << 2) >> 2] = i7;
    i23 = i53 + (i12 << 3) | 0;
    i24 = HEAP32[i23 + 4 >> 2] | 0;
    i27 = i51;
    HEAP32[i27 >> 2] = HEAP32[i23 >> 2];
    HEAP32[i27 + 4 >> 2] = i24;
    i27 = 51;
    break;
   }
   if (!i31) {
    i1 = 0;
    break L1;
   }
   _pop_arg(i51, i7, i52);
  } while (0);
  if ((i27 | 0) == 51 ? (i27 = 0, !i31) : 0) {
   i2 = 0;
   i8 = i26;
   i3 = i25;
   continue;
  }
  i20 = HEAP8[i2 >> 0] | 0;
  i20 = (i10 | 0) != 0 & (i20 & 15 | 0) == 3 ? i20 & -33 : i20;
  i9 = i5 & -65537;
  i24 = (i5 & 8192 | 0) == 0 ? i5 : i9;
  L74 : do switch (i20 | 0) {
  case 110:
   switch ((i10 & 255) << 24 >> 24) {
   case 0:
    {
     HEAP32[HEAP32[i51 >> 2] >> 2] = i1;
     i2 = 0;
     i8 = i26;
     i3 = i25;
     continue L1;
    }
   case 1:
    {
     HEAP32[HEAP32[i51 >> 2] >> 2] = i1;
     i2 = 0;
     i8 = i26;
     i3 = i25;
     continue L1;
    }
   case 2:
    {
     i2 = HEAP32[i51 >> 2] | 0;
     HEAP32[i2 >> 2] = i1;
     HEAP32[i2 + 4 >> 2] = ((i1 | 0) < 0) << 31 >> 31;
     i2 = 0;
     i8 = i26;
     i3 = i25;
     continue L1;
    }
   case 3:
    {
     HEAP16[HEAP32[i51 >> 2] >> 1] = i1;
     i2 = 0;
     i8 = i26;
     i3 = i25;
     continue L1;
    }
   case 4:
    {
     HEAP8[HEAP32[i51 >> 2] >> 0] = i1;
     i2 = 0;
     i8 = i26;
     i3 = i25;
     continue L1;
    }
   case 6:
    {
     HEAP32[HEAP32[i51 >> 2] >> 2] = i1;
     i2 = 0;
     i8 = i26;
     i3 = i25;
     continue L1;
    }
   case 7:
    {
     i2 = HEAP32[i51 >> 2] | 0;
     HEAP32[i2 >> 2] = i1;
     HEAP32[i2 + 4 >> 2] = ((i1 | 0) < 0) << 31 >> 31;
     i2 = 0;
     i8 = i26;
     i3 = i25;
     continue L1;
    }
   default:
    {
     i2 = 0;
     i8 = i26;
     i3 = i25;
     continue L1;
    }
   }
  case 112:
   {
    i9 = 120;
    i10 = i13 >>> 0 > 8 ? i13 : 8;
    i2 = i24 | 8;
    i27 = 63;
    break;
   }
  case 88:
  case 120:
   {
    i9 = i20;
    i10 = i13;
    i2 = i24;
    i27 = 63;
    break;
   }
  case 111:
   {
    i4 = i51;
    i2 = HEAP32[i4 >> 2] | 0;
    i4 = HEAP32[i4 + 4 >> 2] | 0;
    if ((i2 | 0) == 0 & (i4 | 0) == 0) i3 = i32; else {
     i3 = i32;
     do {
      i3 = i3 + -1 | 0;
      HEAP8[i3 >> 0] = i2 & 7 | 48;
      i2 = _bitshift64Lshr(i2 | 0, i4 | 0, 3) | 0;
      i4 = tempRet0;
     } while (!((i2 | 0) == 0 & (i4 | 0) == 0));
    }
    if (!(i24 & 8)) {
     i4 = 0;
     i5 = 1057;
     i7 = i13;
     i2 = i24;
     i27 = 76;
    } else {
     i7 = i33 - i3 | 0;
     i4 = 0;
     i5 = 1057;
     i7 = (i13 | 0) > (i7 | 0) ? i13 : i7 + 1 | 0;
     i2 = i24;
     i27 = 76;
    }
    break;
   }
  case 105:
  case 100:
   {
    i3 = i51;
    i2 = HEAP32[i3 >> 2] | 0;
    i3 = HEAP32[i3 + 4 >> 2] | 0;
    if ((i3 | 0) < 0) {
     i2 = _i64Subtract(0, 0, i2 | 0, i3 | 0) | 0;
     i3 = tempRet0;
     i4 = i51;
     HEAP32[i4 >> 2] = i2;
     HEAP32[i4 + 4 >> 2] = i3;
     i4 = 1;
     i5 = 1057;
     i27 = 75;
     break L74;
    }
    if (!(i24 & 2048)) {
     i5 = i24 & 1;
     i4 = i5;
     i5 = (i5 | 0) == 0 ? 1057 : 1059;
     i27 = 75;
    } else {
     i4 = 1;
     i5 = 1058;
     i27 = 75;
    }
    break;
   }
  case 117:
   {
    i3 = i51;
    i4 = 0;
    i5 = 1057;
    i2 = HEAP32[i3 >> 2] | 0;
    i3 = HEAP32[i3 + 4 >> 2] | 0;
    i27 = 75;
    break;
   }
  case 99:
   {
    HEAP8[i34 >> 0] = HEAP32[i51 >> 2];
    i3 = i34;
    i12 = 0;
    i10 = 1057;
    i4 = i32;
    i2 = 1;
    break;
   }
  case 109:
   {
    i2 = _strerror(HEAP32[(___errno_location() | 0) >> 2] | 0) | 0;
    i27 = 81;
    break;
   }
  case 115:
   {
    i2 = HEAP32[i51 >> 2] | 0;
    i2 = i2 | 0 ? i2 : 1067;
    i27 = 81;
    break;
   }
  case 67:
   {
    HEAP32[i29 >> 2] = HEAP32[i51 >> 2];
    HEAP32[i35 >> 2] = 0;
    HEAP32[i51 >> 2] = i29;
    i9 = -1;
    i4 = i29;
    i27 = 85;
    break;
   }
  case 83:
   {
    i2 = HEAP32[i51 >> 2] | 0;
    if (!i13) {
     _pad(i28, 32, i8, 0, i24);
     i2 = 0;
     i27 = 96;
    } else {
     i9 = i13;
     i4 = i2;
     i27 = 85;
    }
    break;
   }
  case 65:
  case 71:
  case 70:
  case 69:
  case 97:
  case 103:
  case 102:
  case 101:
   {
    d6 = +HEAPF64[i51 >> 3];
    HEAP32[i49 >> 2] = 0;
    HEAPF64[tempDoublePtr >> 3] = d6;
    if ((HEAP32[tempDoublePtr + 4 >> 2] | 0) >= 0) {
     i2 = i24 & 1;
     if (!(i24 & 2048)) {
      i22 = i2;
      i23 = (i2 | 0) == 0 ? 1075 : 1080;
     } else {
      i22 = 1;
      i23 = 1077;
     }
    } else {
     d6 = -d6;
     i22 = 1;
     i23 = 1074;
    }
    HEAPF64[tempDoublePtr >> 3] = d6;
    i21 = HEAP32[tempDoublePtr + 4 >> 2] & 2146435072;
    do if (i21 >>> 0 < 2146435072 | (i21 | 0) == 2146435072 & 0 < 0) {
     d11 = +_frexpl(d6, i49) * 2.0;
     i3 = d11 != 0.0;
     if (i3) HEAP32[i49 >> 2] = (HEAP32[i49 >> 2] | 0) + -1;
     i15 = i20 | 32;
     if ((i15 | 0) == 97) {
      i7 = i20 & 32;
      i12 = (i7 | 0) == 0 ? i23 : i23 + 9 | 0;
      i10 = i22 | 2;
      i2 = 12 - i13 | 0;
      do if (!(i13 >>> 0 > 11 | (i2 | 0) == 0)) {
       d6 = 8.0;
       do {
        i2 = i2 + -1 | 0;
        d6 = d6 * 16.0;
       } while ((i2 | 0) != 0);
       if ((HEAP8[i12 >> 0] | 0) == 45) {
        d6 = -(d6 + (-d11 - d6));
        break;
       } else {
        d6 = d11 + d6 - d6;
        break;
       }
      } else d6 = d11; while (0);
      i3 = HEAP32[i49 >> 2] | 0;
      i2 = (i3 | 0) < 0 ? 0 - i3 | 0 : i3;
      i2 = _fmt_u(i2, ((i2 | 0) < 0) << 31 >> 31, i38) | 0;
      if ((i2 | 0) == (i38 | 0)) {
       HEAP8[i39 >> 0] = 48;
       i2 = i39;
      }
      HEAP8[i2 + -1 >> 0] = (i3 >> 31 & 2) + 43;
      i9 = i2 + -2 | 0;
      HEAP8[i9 >> 0] = i20 + 15;
      i5 = (i13 | 0) < 1;
      i4 = (i24 & 8 | 0) == 0;
      i2 = i50;
      do {
       i23 = ~~d6;
       i3 = i2 + 1 | 0;
       HEAP8[i2 >> 0] = HEAPU8[1041 + i23 >> 0] | i7;
       d6 = (d6 - +(i23 | 0)) * 16.0;
       do if ((i3 - i36 | 0) == 1) {
        if (i4 & (i5 & d6 == 0.0)) {
         i2 = i3;
         break;
        }
        HEAP8[i3 >> 0] = 46;
        i2 = i2 + 2 | 0;
       } else i2 = i3; while (0);
      } while (d6 != 0.0);
      i5 = i9;
      i4 = (i13 | 0) != 0 & (i42 + i2 | 0) < (i13 | 0) ? i43 + i13 - i5 | 0 : i41 - i5 + i2 | 0;
      i7 = i4 + i10 | 0;
      _pad(i28, 32, i8, i7, i24);
      if (!(HEAP32[i28 >> 2] & 32)) ___fwritex(i12, i10, i28) | 0;
      _pad(i28, 48, i8, i7, i24 ^ 65536);
      i3 = i2 - i36 | 0;
      if (!(HEAP32[i28 >> 2] & 32)) ___fwritex(i50, i3, i28) | 0;
      i2 = i40 - i5 | 0;
      _pad(i28, 48, i4 - (i3 + i2) | 0, 0, 0);
      if (!(HEAP32[i28 >> 2] & 32)) ___fwritex(i9, i2, i28) | 0;
      _pad(i28, 32, i8, i7, i24 ^ 8192);
      i2 = (i7 | 0) < (i8 | 0) ? i8 : i7;
      break;
     }
     i2 = (i13 | 0) < 0 ? 6 : i13;
     if (i3) {
      i3 = (HEAP32[i49 >> 2] | 0) + -28 | 0;
      HEAP32[i49 >> 2] = i3;
      d6 = d11 * 268435456.0;
     } else {
      d6 = d11;
      i3 = HEAP32[i49 >> 2] | 0;
     }
     i21 = (i3 | 0) < 0 ? i48 : i44;
     i4 = i21;
     do {
      i19 = ~~d6 >>> 0;
      HEAP32[i4 >> 2] = i19;
      i4 = i4 + 4 | 0;
      d6 = (d6 - +(i19 >>> 0)) * 1.0e9;
     } while (d6 != 0.0);
     if ((i3 | 0) > 0) {
      i5 = i21;
      i9 = i4;
      while (1) {
       i7 = (i3 | 0) > 29 ? 29 : i3;
       i3 = i9 + -4 | 0;
       do if (i3 >>> 0 >= i5 >>> 0) {
        i4 = 0;
        do {
         i18 = _bitshift64Shl(HEAP32[i3 >> 2] | 0, 0, i7 | 0) | 0;
         i18 = _i64Add(i18 | 0, tempRet0 | 0, i4 | 0, 0) | 0;
         i19 = tempRet0;
         i17 = ___uremdi3(i18 | 0, i19 | 0, 1e9, 0) | 0;
         HEAP32[i3 >> 2] = i17;
         i4 = ___udivdi3(i18 | 0, i19 | 0, 1e9, 0) | 0;
         i3 = i3 + -4 | 0;
        } while (i3 >>> 0 >= i5 >>> 0);
        if (!i4) break;
        i5 = i5 + -4 | 0;
        HEAP32[i5 >> 2] = i4;
       } while (0);
       i4 = i9;
       while (1) {
        if (i4 >>> 0 <= i5 >>> 0) break;
        i3 = i4 + -4 | 0;
        if (!(HEAP32[i3 >> 2] | 0)) i4 = i3; else break;
       }
       i3 = (HEAP32[i49 >> 2] | 0) - i7 | 0;
       HEAP32[i49 >> 2] = i3;
       if ((i3 | 0) > 0) i9 = i4; else break;
      }
     } else i5 = i21;
     if ((i3 | 0) < 0) {
      i13 = ((i2 + 25 | 0) / 9 | 0) + 1 | 0;
      i14 = (i15 | 0) == 102;
      do {
       i12 = 0 - i3 | 0;
       i12 = (i12 | 0) > 9 ? 9 : i12;
       do if (i5 >>> 0 < i4 >>> 0) {
        i7 = (1 << i12) + -1 | 0;
        i9 = 1e9 >>> i12;
        i10 = 0;
        i3 = i5;
        do {
         i19 = HEAP32[i3 >> 2] | 0;
         HEAP32[i3 >> 2] = (i19 >>> i12) + i10;
         i10 = Math_imul(i19 & i7, i9) | 0;
         i3 = i3 + 4 | 0;
        } while (i3 >>> 0 < i4 >>> 0);
        i3 = (HEAP32[i5 >> 2] | 0) == 0 ? i5 + 4 | 0 : i5;
        if (!i10) {
         i5 = i3;
         i3 = i4;
         break;
        }
        HEAP32[i4 >> 2] = i10;
        i5 = i3;
        i3 = i4 + 4 | 0;
       } else {
        i5 = (HEAP32[i5 >> 2] | 0) == 0 ? i5 + 4 | 0 : i5;
        i3 = i4;
       } while (0);
       i4 = i14 ? i21 : i5;
       i4 = (i3 - i4 >> 2 | 0) > (i13 | 0) ? i4 + (i13 << 2) | 0 : i3;
       i3 = (HEAP32[i49 >> 2] | 0) + i12 | 0;
       HEAP32[i49 >> 2] = i3;
      } while ((i3 | 0) < 0);
     }
     i19 = i21;
     do if (i5 >>> 0 < i4 >>> 0) {
      i3 = (i19 - i5 >> 2) * 9 | 0;
      i9 = HEAP32[i5 >> 2] | 0;
      if (i9 >>> 0 < 10) break; else i7 = 10;
      do {
       i7 = i7 * 10 | 0;
       i3 = i3 + 1 | 0;
      } while (i9 >>> 0 >= i7 >>> 0);
     } else i3 = 0; while (0);
     i16 = (i15 | 0) == 103;
     i17 = (i2 | 0) != 0;
     i7 = i2 - ((i15 | 0) != 102 ? i3 : 0) + ((i17 & i16) << 31 >> 31) | 0;
     if ((i7 | 0) < (((i4 - i19 >> 2) * 9 | 0) + -9 | 0)) {
      i7 = i7 + 9216 | 0;
      i10 = i21 + 4 + (((i7 | 0) / 9 | 0) + -1024 << 2) | 0;
      i7 = ((i7 | 0) % 9 | 0) + 1 | 0;
      if ((i7 | 0) < 9) {
       i9 = 10;
       do {
        i9 = i9 * 10 | 0;
        i7 = i7 + 1 | 0;
       } while ((i7 | 0) != 9);
      } else i9 = 10;
      i13 = HEAP32[i10 >> 2] | 0;
      i14 = (i13 >>> 0) % (i9 >>> 0) | 0;
      i7 = (i10 + 4 | 0) == (i4 | 0);
      do if (i7 & (i14 | 0) == 0) i7 = i10; else {
       d11 = (((i13 >>> 0) / (i9 >>> 0) | 0) & 1 | 0) == 0 ? 9007199254740992.0 : 9007199254740994.0;
       i12 = (i9 | 0) / 2 | 0;
       if (i14 >>> 0 < i12 >>> 0) d6 = .5; else d6 = i7 & (i14 | 0) == (i12 | 0) ? 1.0 : 1.5;
       do if (i22) {
        if ((HEAP8[i23 >> 0] | 0) != 45) break;
        d6 = -d6;
        d11 = -d11;
       } while (0);
       i7 = i13 - i14 | 0;
       HEAP32[i10 >> 2] = i7;
       if (!(d11 + d6 != d11)) {
        i7 = i10;
        break;
       }
       i18 = i7 + i9 | 0;
       HEAP32[i10 >> 2] = i18;
       if (i18 >>> 0 > 999999999) {
        i7 = i10;
        while (1) {
         i3 = i7 + -4 | 0;
         HEAP32[i7 >> 2] = 0;
         if (i3 >>> 0 < i5 >>> 0) {
          i5 = i5 + -4 | 0;
          HEAP32[i5 >> 2] = 0;
         }
         i18 = (HEAP32[i3 >> 2] | 0) + 1 | 0;
         HEAP32[i3 >> 2] = i18;
         if (i18 >>> 0 > 999999999) i7 = i3; else {
          i10 = i3;
          break;
         }
        }
       }
       i3 = (i19 - i5 >> 2) * 9 | 0;
       i9 = HEAP32[i5 >> 2] | 0;
       if (i9 >>> 0 < 10) {
        i7 = i10;
        break;
       } else i7 = 10;
       do {
        i7 = i7 * 10 | 0;
        i3 = i3 + 1 | 0;
       } while (i9 >>> 0 >= i7 >>> 0);
       i7 = i10;
      } while (0);
      i18 = i7 + 4 | 0;
      i4 = i4 >>> 0 > i18 >>> 0 ? i18 : i4;
     }
     i14 = 0 - i3 | 0;
     i18 = i4;
     while (1) {
      if (i18 >>> 0 <= i5 >>> 0) {
       i15 = 0;
       break;
      }
      i4 = i18 + -4 | 0;
      if (!(HEAP32[i4 >> 2] | 0)) i18 = i4; else {
       i15 = 1;
       break;
      }
     }
     do if (i16) {
      i2 = (i17 & 1 ^ 1) + i2 | 0;
      if ((i2 | 0) > (i3 | 0) & (i3 | 0) > -5) {
       i10 = i20 + -1 | 0;
       i2 = i2 + -1 - i3 | 0;
      } else {
       i10 = i20 + -2 | 0;
       i2 = i2 + -1 | 0;
      }
      i4 = i24 & 8;
      if (i4 | 0) {
       i12 = i4;
       break;
      }
      do if (i15) {
       i9 = HEAP32[i18 + -4 >> 2] | 0;
       if (!i9) {
        i7 = 9;
        break;
       }
       if (!((i9 >>> 0) % 10 | 0)) {
        i7 = 0;
        i4 = 10;
       } else {
        i7 = 0;
        break;
       }
       do {
        i4 = i4 * 10 | 0;
        i7 = i7 + 1 | 0;
       } while (!((i9 >>> 0) % (i4 >>> 0) | 0 | 0));
      } else i7 = 9; while (0);
      i4 = ((i18 - i19 >> 2) * 9 | 0) + -9 | 0;
      if ((i10 | 32 | 0) == 102) {
       i12 = i4 - i7 | 0;
       i12 = (i12 | 0) < 0 ? 0 : i12;
       i2 = (i2 | 0) < (i12 | 0) ? i2 : i12;
       i12 = 0;
       break;
      } else {
       i12 = i4 + i3 - i7 | 0;
       i12 = (i12 | 0) < 0 ? 0 : i12;
       i2 = (i2 | 0) < (i12 | 0) ? i2 : i12;
       i12 = 0;
       break;
      }
     } else {
      i10 = i20;
      i12 = i24 & 8;
     } while (0);
     i13 = i2 | i12;
     i7 = (i13 | 0) != 0 & 1;
     i9 = (i10 | 32 | 0) == 102;
     if (i9) {
      i14 = 0;
      i3 = (i3 | 0) > 0 ? i3 : 0;
     } else {
      i4 = (i3 | 0) < 0 ? i14 : i3;
      i4 = _fmt_u(i4, ((i4 | 0) < 0) << 31 >> 31, i38) | 0;
      if ((i40 - i4 | 0) < 2) do {
       i4 = i4 + -1 | 0;
       HEAP8[i4 >> 0] = 48;
      } while ((i40 - i4 | 0) < 2);
      HEAP8[i4 + -1 >> 0] = (i3 >> 31 & 2) + 43;
      i3 = i4 + -2 | 0;
      HEAP8[i3 >> 0] = i10;
      i14 = i3;
      i3 = i40 - i3 | 0;
     }
     i16 = i22 + 1 + i2 + i7 + i3 | 0;
     _pad(i28, 32, i8, i16, i24);
     if (!(HEAP32[i28 >> 2] & 32)) ___fwritex(i23, i22, i28) | 0;
     _pad(i28, 48, i8, i16, i24 ^ 65536);
     do if (i9) {
      i5 = i5 >>> 0 > i21 >>> 0 ? i21 : i5;
      i4 = i5;
      do {
       i3 = _fmt_u(HEAP32[i4 >> 2] | 0, 0, i45) | 0;
       do if ((i4 | 0) == (i5 | 0)) {
        if ((i3 | 0) != (i45 | 0)) break;
        HEAP8[i47 >> 0] = 48;
        i3 = i47;
       } else {
        if (i3 >>> 0 <= i50 >>> 0) break;
        _memset(i50 | 0, 48, i3 - i36 | 0) | 0;
        do i3 = i3 + -1 | 0; while (i3 >>> 0 > i50 >>> 0);
       } while (0);
       if (!(HEAP32[i28 >> 2] & 32)) ___fwritex(i3, i46 - i3 | 0, i28) | 0;
       i4 = i4 + 4 | 0;
      } while (i4 >>> 0 <= i21 >>> 0);
      do if (i13 | 0) {
       if (HEAP32[i28 >> 2] & 32 | 0) break;
       ___fwritex(1109, 1, i28) | 0;
      } while (0);
      if ((i2 | 0) > 0 & i4 >>> 0 < i18 >>> 0) while (1) {
       i3 = _fmt_u(HEAP32[i4 >> 2] | 0, 0, i45) | 0;
       if (i3 >>> 0 > i50 >>> 0) {
        _memset(i50 | 0, 48, i3 - i36 | 0) | 0;
        do i3 = i3 + -1 | 0; while (i3 >>> 0 > i50 >>> 0);
       }
       if (!(HEAP32[i28 >> 2] & 32)) ___fwritex(i3, (i2 | 0) > 9 ? 9 : i2, i28) | 0;
       i4 = i4 + 4 | 0;
       i3 = i2 + -9 | 0;
       if (!((i2 | 0) > 9 & i4 >>> 0 < i18 >>> 0)) {
        i2 = i3;
        break;
       } else i2 = i3;
      }
      _pad(i28, 48, i2 + 9 | 0, 9, 0);
     } else {
      i10 = i15 ? i18 : i5 + 4 | 0;
      if ((i2 | 0) > -1) {
       i9 = (i12 | 0) == 0;
       i7 = i5;
       do {
        i3 = _fmt_u(HEAP32[i7 >> 2] | 0, 0, i45) | 0;
        if ((i3 | 0) == (i45 | 0)) {
         HEAP8[i47 >> 0] = 48;
         i3 = i47;
        }
        do if ((i7 | 0) == (i5 | 0)) {
         i4 = i3 + 1 | 0;
         if (!(HEAP32[i28 >> 2] & 32)) ___fwritex(i3, 1, i28) | 0;
         if (i9 & (i2 | 0) < 1) {
          i3 = i4;
          break;
         }
         if (HEAP32[i28 >> 2] & 32 | 0) {
          i3 = i4;
          break;
         }
         ___fwritex(1109, 1, i28) | 0;
         i3 = i4;
        } else {
         if (i3 >>> 0 <= i50 >>> 0) break;
         _memset(i50 | 0, 48, i3 + i37 | 0) | 0;
         do i3 = i3 + -1 | 0; while (i3 >>> 0 > i50 >>> 0);
        } while (0);
        i4 = i46 - i3 | 0;
        if (!(HEAP32[i28 >> 2] & 32)) ___fwritex(i3, (i2 | 0) > (i4 | 0) ? i4 : i2, i28) | 0;
        i2 = i2 - i4 | 0;
        i7 = i7 + 4 | 0;
       } while (i7 >>> 0 < i10 >>> 0 & (i2 | 0) > -1);
      }
      _pad(i28, 48, i2 + 18 | 0, 18, 0);
      if (HEAP32[i28 >> 2] & 32 | 0) break;
      ___fwritex(i14, i40 - i14 | 0, i28) | 0;
     } while (0);
     _pad(i28, 32, i8, i16, i24 ^ 8192);
     i2 = (i16 | 0) < (i8 | 0) ? i8 : i16;
    } else {
     i7 = (i20 & 32 | 0) != 0;
     i5 = d6 != d6 | 0.0 != 0.0;
     i3 = i5 ? 0 : i22;
     i4 = i3 + 3 | 0;
     _pad(i28, 32, i8, i4, i9);
     i2 = HEAP32[i28 >> 2] | 0;
     if (!(i2 & 32)) {
      ___fwritex(i23, i3, i28) | 0;
      i2 = HEAP32[i28 >> 2] | 0;
     }
     if (!(i2 & 32)) ___fwritex(i5 ? (i7 ? 1101 : 1105) : i7 ? 1093 : 1097, 3, i28) | 0;
     _pad(i28, 32, i8, i4, i24 ^ 8192);
     i2 = (i4 | 0) < (i8 | 0) ? i8 : i4;
    } while (0);
    i8 = i26;
    i3 = i25;
    continue L1;
   }
  default:
   {
    i12 = 0;
    i10 = 1057;
    i4 = i32;
    i2 = i13;
    i9 = i24;
   }
  } while (0);
  L310 : do if ((i27 | 0) == 63) {
   i5 = i51;
   i4 = HEAP32[i5 >> 2] | 0;
   i5 = HEAP32[i5 + 4 >> 2] | 0;
   i7 = i9 & 32;
   if ((i4 | 0) == 0 & (i5 | 0) == 0) {
    i3 = i32;
    i4 = 0;
    i5 = 0;
   } else {
    i3 = i32;
    do {
     i3 = i3 + -1 | 0;
     HEAP8[i3 >> 0] = HEAPU8[1041 + (i4 & 15) >> 0] | i7;
     i4 = _bitshift64Lshr(i4 | 0, i5 | 0, 4) | 0;
     i5 = tempRet0;
    } while (!((i4 | 0) == 0 & (i5 | 0) == 0));
    i5 = i51;
    i4 = HEAP32[i5 >> 2] | 0;
    i5 = HEAP32[i5 + 4 >> 2] | 0;
   }
   i5 = (i2 & 8 | 0) == 0 | (i4 | 0) == 0 & (i5 | 0) == 0;
   i4 = i5 ? 0 : 2;
   i5 = i5 ? 1057 : 1057 + (i9 >> 4) | 0;
   i7 = i10;
   i27 = 76;
  } else if ((i27 | 0) == 75) {
   i3 = _fmt_u(i2, i3, i32) | 0;
   i7 = i13;
   i2 = i24;
   i27 = 76;
  } else if ((i27 | 0) == 81) {
   i27 = 0;
   i24 = _memchr(i2, 0, i13) | 0;
   i23 = (i24 | 0) == 0;
   i3 = i2;
   i12 = 0;
   i10 = 1057;
   i4 = i23 ? i2 + i13 | 0 : i24;
   i2 = i23 ? i13 : i24 - i2 | 0;
  } else if ((i27 | 0) == 85) {
   i27 = 0;
   i7 = i4;
   i2 = 0;
   i3 = 0;
   while (1) {
    i5 = HEAP32[i7 >> 2] | 0;
    if (!i5) break;
    i3 = _wctomb(i30, i5) | 0;
    if ((i3 | 0) < 0 | i3 >>> 0 > (i9 - i2 | 0) >>> 0) break;
    i2 = i3 + i2 | 0;
    if (i9 >>> 0 > i2 >>> 0) i7 = i7 + 4 | 0; else break;
   }
   if ((i3 | 0) < 0) {
    i1 = -1;
    break L1;
   }
   _pad(i28, 32, i8, i2, i24);
   if (!i2) {
    i2 = 0;
    i27 = 96;
   } else {
    i5 = 0;
    while (1) {
     i3 = HEAP32[i4 >> 2] | 0;
     if (!i3) {
      i27 = 96;
      break L310;
     }
     i3 = _wctomb(i30, i3) | 0;
     i5 = i3 + i5 | 0;
     if ((i5 | 0) > (i2 | 0)) {
      i27 = 96;
      break L310;
     }
     if (!(HEAP32[i28 >> 2] & 32)) ___fwritex(i30, i3, i28) | 0;
     if (i5 >>> 0 >= i2 >>> 0) {
      i27 = 96;
      break;
     } else i4 = i4 + 4 | 0;
    }
   }
  } while (0);
  if ((i27 | 0) == 96) {
   i27 = 0;
   _pad(i28, 32, i8, i2, i24 ^ 8192);
   i2 = (i8 | 0) > (i2 | 0) ? i8 : i2;
   i8 = i26;
   i3 = i25;
   continue;
  }
  if ((i27 | 0) == 76) {
   i27 = 0;
   i9 = (i7 | 0) > -1 ? i2 & -65537 : i2;
   i2 = i51;
   i2 = (HEAP32[i2 >> 2] | 0) != 0 | (HEAP32[i2 + 4 >> 2] | 0) != 0;
   if ((i7 | 0) != 0 | i2) {
    i2 = (i2 & 1 ^ 1) + (i33 - i3) | 0;
    i12 = i4;
    i10 = i5;
    i4 = i32;
    i2 = (i7 | 0) > (i2 | 0) ? i7 : i2;
   } else {
    i3 = i32;
    i12 = i4;
    i10 = i5;
    i4 = i32;
    i2 = 0;
   }
  }
  i7 = i4 - i3 | 0;
  i4 = (i2 | 0) < (i7 | 0) ? i7 : i2;
  i5 = i4 + i12 | 0;
  i2 = (i8 | 0) < (i5 | 0) ? i5 : i8;
  _pad(i28, 32, i2, i5, i9);
  if (!(HEAP32[i28 >> 2] & 32)) ___fwritex(i10, i12, i28) | 0;
  _pad(i28, 48, i2, i5, i9 ^ 65536);
  _pad(i28, 48, i4, i7, 0);
  if (!(HEAP32[i28 >> 2] & 32)) ___fwritex(i3, i7, i28) | 0;
  _pad(i28, 32, i2, i5, i9 ^ 8192);
  i8 = i26;
  i3 = i25;
 }
 L345 : do if ((i27 | 0) == 243) if (!i28) if (!i8) i1 = 0; else {
  i1 = 1;
  while (1) {
   i2 = HEAP32[i54 + (i1 << 2) >> 2] | 0;
   if (!i2) break;
   _pop_arg(i53 + (i1 << 3) | 0, i2, i52);
   i1 = i1 + 1 | 0;
   if ((i1 | 0) >= 10) {
    i1 = 1;
    break L345;
   }
  }
  while (1) {
   if (HEAP32[i54 + (i1 << 2) >> 2] | 0) {
    i1 = -1;
    break L345;
   }
   i1 = i1 + 1 | 0;
   if ((i1 | 0) >= 10) {
    i1 = 1;
    break;
   }
  }
 } while (0);
 STACKTOP = i55;
 return i1 | 0;
}

function _free(i1) {
 i1 = i1 | 0;
 var i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0;
 if (!i1) return;
 i3 = i1 + -8 | 0;
 i7 = HEAP32[922] | 0;
 if (i3 >>> 0 < i7 >>> 0) _abort();
 i1 = HEAP32[i1 + -4 >> 2] | 0;
 i2 = i1 & 3;
 if ((i2 | 0) == 1) _abort();
 i4 = i1 & -8;
 i13 = i3 + i4 | 0;
 do if (!(i1 & 1)) {
  i1 = HEAP32[i3 >> 2] | 0;
  if (!i2) return;
  i10 = i3 + (0 - i1) | 0;
  i9 = i1 + i4 | 0;
  if (i10 >>> 0 < i7 >>> 0) _abort();
  if ((i10 | 0) == (HEAP32[923] | 0)) {
   i1 = i13 + 4 | 0;
   i2 = HEAP32[i1 >> 2] | 0;
   if ((i2 & 3 | 0) != 3) {
    i16 = i10;
    i5 = i9;
    break;
   }
   HEAP32[920] = i9;
   HEAP32[i1 >> 2] = i2 & -2;
   HEAP32[i10 + 4 >> 2] = i9 | 1;
   HEAP32[i10 + i9 >> 2] = i9;
   return;
  }
  i4 = i1 >>> 3;
  if (i1 >>> 0 < 256) {
   i2 = HEAP32[i10 + 8 >> 2] | 0;
   i3 = HEAP32[i10 + 12 >> 2] | 0;
   i1 = 3712 + (i4 << 1 << 2) | 0;
   if ((i2 | 0) != (i1 | 0)) {
    if (i2 >>> 0 < i7 >>> 0) _abort();
    if ((HEAP32[i2 + 12 >> 2] | 0) != (i10 | 0)) _abort();
   }
   if ((i3 | 0) == (i2 | 0)) {
    HEAP32[918] = HEAP32[918] & ~(1 << i4);
    i16 = i10;
    i5 = i9;
    break;
   }
   if ((i3 | 0) != (i1 | 0)) {
    if (i3 >>> 0 < i7 >>> 0) _abort();
    i1 = i3 + 8 | 0;
    if ((HEAP32[i1 >> 2] | 0) == (i10 | 0)) i6 = i1; else _abort();
   } else i6 = i3 + 8 | 0;
   HEAP32[i2 + 12 >> 2] = i3;
   HEAP32[i6 >> 2] = i2;
   i16 = i10;
   i5 = i9;
   break;
  }
  i6 = HEAP32[i10 + 24 >> 2] | 0;
  i3 = HEAP32[i10 + 12 >> 2] | 0;
  do if ((i3 | 0) == (i10 | 0)) {
   i3 = i10 + 16 | 0;
   i2 = i3 + 4 | 0;
   i1 = HEAP32[i2 >> 2] | 0;
   if (!i1) {
    i1 = HEAP32[i3 >> 2] | 0;
    if (!i1) {
     i8 = 0;
     break;
    } else i2 = i3;
   }
   while (1) {
    i3 = i1 + 20 | 0;
    i4 = HEAP32[i3 >> 2] | 0;
    if (i4 | 0) {
     i1 = i4;
     i2 = i3;
     continue;
    }
    i3 = i1 + 16 | 0;
    i4 = HEAP32[i3 >> 2] | 0;
    if (!i4) break; else {
     i1 = i4;
     i2 = i3;
    }
   }
   if (i2 >>> 0 < i7 >>> 0) _abort(); else {
    HEAP32[i2 >> 2] = 0;
    i8 = i1;
    break;
   }
  } else {
   i4 = HEAP32[i10 + 8 >> 2] | 0;
   if (i4 >>> 0 < i7 >>> 0) _abort();
   i1 = i4 + 12 | 0;
   if ((HEAP32[i1 >> 2] | 0) != (i10 | 0)) _abort();
   i2 = i3 + 8 | 0;
   if ((HEAP32[i2 >> 2] | 0) == (i10 | 0)) {
    HEAP32[i1 >> 2] = i3;
    HEAP32[i2 >> 2] = i4;
    i8 = i3;
    break;
   } else _abort();
  } while (0);
  if (i6) {
   i1 = HEAP32[i10 + 28 >> 2] | 0;
   i2 = 3976 + (i1 << 2) | 0;
   if ((i10 | 0) == (HEAP32[i2 >> 2] | 0)) {
    HEAP32[i2 >> 2] = i8;
    if (!i8) {
     HEAP32[919] = HEAP32[919] & ~(1 << i1);
     i16 = i10;
     i5 = i9;
     break;
    }
   } else {
    if (i6 >>> 0 < (HEAP32[922] | 0) >>> 0) _abort();
    i1 = i6 + 16 | 0;
    if ((HEAP32[i1 >> 2] | 0) == (i10 | 0)) HEAP32[i1 >> 2] = i8; else HEAP32[i6 + 20 >> 2] = i8;
    if (!i8) {
     i16 = i10;
     i5 = i9;
     break;
    }
   }
   i3 = HEAP32[922] | 0;
   if (i8 >>> 0 < i3 >>> 0) _abort();
   HEAP32[i8 + 24 >> 2] = i6;
   i1 = i10 + 16 | 0;
   i2 = HEAP32[i1 >> 2] | 0;
   do if (i2 | 0) if (i2 >>> 0 < i3 >>> 0) _abort(); else {
    HEAP32[i8 + 16 >> 2] = i2;
    HEAP32[i2 + 24 >> 2] = i8;
    break;
   } while (0);
   i1 = HEAP32[i1 + 4 >> 2] | 0;
   if (i1) if (i1 >>> 0 < (HEAP32[922] | 0) >>> 0) _abort(); else {
    HEAP32[i8 + 20 >> 2] = i1;
    HEAP32[i1 + 24 >> 2] = i8;
    i16 = i10;
    i5 = i9;
    break;
   } else {
    i16 = i10;
    i5 = i9;
   }
  } else {
   i16 = i10;
   i5 = i9;
  }
 } else {
  i16 = i3;
  i5 = i4;
 } while (0);
 if (i16 >>> 0 >= i13 >>> 0) _abort();
 i1 = i13 + 4 | 0;
 i2 = HEAP32[i1 >> 2] | 0;
 if (!(i2 & 1)) _abort();
 if (!(i2 & 2)) {
  if ((i13 | 0) == (HEAP32[924] | 0)) {
   i15 = (HEAP32[921] | 0) + i5 | 0;
   HEAP32[921] = i15;
   HEAP32[924] = i16;
   HEAP32[i16 + 4 >> 2] = i15 | 1;
   if ((i16 | 0) != (HEAP32[923] | 0)) return;
   HEAP32[923] = 0;
   HEAP32[920] = 0;
   return;
  }
  if ((i13 | 0) == (HEAP32[923] | 0)) {
   i15 = (HEAP32[920] | 0) + i5 | 0;
   HEAP32[920] = i15;
   HEAP32[923] = i16;
   HEAP32[i16 + 4 >> 2] = i15 | 1;
   HEAP32[i16 + i15 >> 2] = i15;
   return;
  }
  i5 = (i2 & -8) + i5 | 0;
  i4 = i2 >>> 3;
  do if (i2 >>> 0 >= 256) {
   i6 = HEAP32[i13 + 24 >> 2] | 0;
   i1 = HEAP32[i13 + 12 >> 2] | 0;
   do if ((i1 | 0) == (i13 | 0)) {
    i3 = i13 + 16 | 0;
    i2 = i3 + 4 | 0;
    i1 = HEAP32[i2 >> 2] | 0;
    if (!i1) {
     i1 = HEAP32[i3 >> 2] | 0;
     if (!i1) {
      i12 = 0;
      break;
     } else i2 = i3;
    }
    while (1) {
     i3 = i1 + 20 | 0;
     i4 = HEAP32[i3 >> 2] | 0;
     if (i4 | 0) {
      i1 = i4;
      i2 = i3;
      continue;
     }
     i3 = i1 + 16 | 0;
     i4 = HEAP32[i3 >> 2] | 0;
     if (!i4) break; else {
      i1 = i4;
      i2 = i3;
     }
    }
    if (i2 >>> 0 < (HEAP32[922] | 0) >>> 0) _abort(); else {
     HEAP32[i2 >> 2] = 0;
     i12 = i1;
     break;
    }
   } else {
    i2 = HEAP32[i13 + 8 >> 2] | 0;
    if (i2 >>> 0 < (HEAP32[922] | 0) >>> 0) _abort();
    i3 = i2 + 12 | 0;
    if ((HEAP32[i3 >> 2] | 0) != (i13 | 0)) _abort();
    i4 = i1 + 8 | 0;
    if ((HEAP32[i4 >> 2] | 0) == (i13 | 0)) {
     HEAP32[i3 >> 2] = i1;
     HEAP32[i4 >> 2] = i2;
     i12 = i1;
     break;
    } else _abort();
   } while (0);
   if (i6 | 0) {
    i1 = HEAP32[i13 + 28 >> 2] | 0;
    i2 = 3976 + (i1 << 2) | 0;
    if ((i13 | 0) == (HEAP32[i2 >> 2] | 0)) {
     HEAP32[i2 >> 2] = i12;
     if (!i12) {
      HEAP32[919] = HEAP32[919] & ~(1 << i1);
      break;
     }
    } else {
     if (i6 >>> 0 < (HEAP32[922] | 0) >>> 0) _abort();
     i1 = i6 + 16 | 0;
     if ((HEAP32[i1 >> 2] | 0) == (i13 | 0)) HEAP32[i1 >> 2] = i12; else HEAP32[i6 + 20 >> 2] = i12;
     if (!i12) break;
    }
    i3 = HEAP32[922] | 0;
    if (i12 >>> 0 < i3 >>> 0) _abort();
    HEAP32[i12 + 24 >> 2] = i6;
    i1 = i13 + 16 | 0;
    i2 = HEAP32[i1 >> 2] | 0;
    do if (i2 | 0) if (i2 >>> 0 < i3 >>> 0) _abort(); else {
     HEAP32[i12 + 16 >> 2] = i2;
     HEAP32[i2 + 24 >> 2] = i12;
     break;
    } while (0);
    i1 = HEAP32[i1 + 4 >> 2] | 0;
    if (i1 | 0) if (i1 >>> 0 < (HEAP32[922] | 0) >>> 0) _abort(); else {
     HEAP32[i12 + 20 >> 2] = i1;
     HEAP32[i1 + 24 >> 2] = i12;
     break;
    }
   }
  } else {
   i2 = HEAP32[i13 + 8 >> 2] | 0;
   i3 = HEAP32[i13 + 12 >> 2] | 0;
   i1 = 3712 + (i4 << 1 << 2) | 0;
   if ((i2 | 0) != (i1 | 0)) {
    if (i2 >>> 0 < (HEAP32[922] | 0) >>> 0) _abort();
    if ((HEAP32[i2 + 12 >> 2] | 0) != (i13 | 0)) _abort();
   }
   if ((i3 | 0) == (i2 | 0)) {
    HEAP32[918] = HEAP32[918] & ~(1 << i4);
    break;
   }
   if ((i3 | 0) != (i1 | 0)) {
    if (i3 >>> 0 < (HEAP32[922] | 0) >>> 0) _abort();
    i1 = i3 + 8 | 0;
    if ((HEAP32[i1 >> 2] | 0) == (i13 | 0)) i11 = i1; else _abort();
   } else i11 = i3 + 8 | 0;
   HEAP32[i2 + 12 >> 2] = i3;
   HEAP32[i11 >> 2] = i2;
  } while (0);
  HEAP32[i16 + 4 >> 2] = i5 | 1;
  HEAP32[i16 + i5 >> 2] = i5;
  if ((i16 | 0) == (HEAP32[923] | 0)) {
   HEAP32[920] = i5;
   return;
  }
 } else {
  HEAP32[i1 >> 2] = i2 & -2;
  HEAP32[i16 + 4 >> 2] = i5 | 1;
  HEAP32[i16 + i5 >> 2] = i5;
 }
 i1 = i5 >>> 3;
 if (i5 >>> 0 < 256) {
  i3 = 3712 + (i1 << 1 << 2) | 0;
  i2 = HEAP32[918] | 0;
  i1 = 1 << i1;
  if (i2 & i1) {
   i1 = i3 + 8 | 0;
   i2 = HEAP32[i1 >> 2] | 0;
   if (i2 >>> 0 < (HEAP32[922] | 0) >>> 0) _abort(); else {
    i14 = i2;
    i15 = i1;
   }
  } else {
   HEAP32[918] = i2 | i1;
   i14 = i3;
   i15 = i3 + 8 | 0;
  }
  HEAP32[i15 >> 2] = i16;
  HEAP32[i14 + 12 >> 2] = i16;
  HEAP32[i16 + 8 >> 2] = i14;
  HEAP32[i16 + 12 >> 2] = i3;
  return;
 }
 i1 = i5 >>> 8;
 if (i1) if (i5 >>> 0 > 16777215) i1 = 31; else {
  i14 = (i1 + 1048320 | 0) >>> 16 & 8;
  i15 = i1 << i14;
  i13 = (i15 + 520192 | 0) >>> 16 & 4;
  i15 = i15 << i13;
  i1 = (i15 + 245760 | 0) >>> 16 & 2;
  i1 = 14 - (i13 | i14 | i1) + (i15 << i1 >>> 15) | 0;
  i1 = i5 >>> (i1 + 7 | 0) & 1 | i1 << 1;
 } else i1 = 0;
 i4 = 3976 + (i1 << 2) | 0;
 HEAP32[i16 + 28 >> 2] = i1;
 HEAP32[i16 + 20 >> 2] = 0;
 HEAP32[i16 + 16 >> 2] = 0;
 i2 = HEAP32[919] | 0;
 i3 = 1 << i1;
 do if (i2 & i3) {
  i2 = i5 << ((i1 | 0) == 31 ? 0 : 25 - (i1 >>> 1) | 0);
  i4 = HEAP32[i4 >> 2] | 0;
  while (1) {
   if ((HEAP32[i4 + 4 >> 2] & -8 | 0) == (i5 | 0)) {
    i1 = 130;
    break;
   }
   i3 = i4 + 16 + (i2 >>> 31 << 2) | 0;
   i1 = HEAP32[i3 >> 2] | 0;
   if (!i1) {
    i1 = 127;
    break;
   } else {
    i2 = i2 << 1;
    i4 = i1;
   }
  }
  if ((i1 | 0) == 127) if (i3 >>> 0 < (HEAP32[922] | 0) >>> 0) _abort(); else {
   HEAP32[i3 >> 2] = i16;
   HEAP32[i16 + 24 >> 2] = i4;
   HEAP32[i16 + 12 >> 2] = i16;
   HEAP32[i16 + 8 >> 2] = i16;
   break;
  } else if ((i1 | 0) == 130) {
   i1 = i4 + 8 | 0;
   i2 = HEAP32[i1 >> 2] | 0;
   i15 = HEAP32[922] | 0;
   if (i2 >>> 0 >= i15 >>> 0 & i4 >>> 0 >= i15 >>> 0) {
    HEAP32[i2 + 12 >> 2] = i16;
    HEAP32[i1 >> 2] = i16;
    HEAP32[i16 + 8 >> 2] = i2;
    HEAP32[i16 + 12 >> 2] = i4;
    HEAP32[i16 + 24 >> 2] = 0;
    break;
   } else _abort();
  }
 } else {
  HEAP32[919] = i2 | i3;
  HEAP32[i4 >> 2] = i16;
  HEAP32[i16 + 24 >> 2] = i4;
  HEAP32[i16 + 12 >> 2] = i16;
  HEAP32[i16 + 8 >> 2] = i16;
 } while (0);
 i16 = (HEAP32[926] | 0) + -1 | 0;
 HEAP32[926] = i16;
 if (!i16) i1 = 4128; else return;
 while (1) {
  i1 = HEAP32[i1 >> 2] | 0;
  if (!i1) break; else i1 = i1 + 8 | 0;
 }
 HEAP32[926] = -1;
 return;
}

function ___udivmoddi4(i5, i6, i8, i11, i13) {
 i5 = i5 | 0;
 i6 = i6 | 0;
 i8 = i8 | 0;
 i11 = i11 | 0;
 i13 = i13 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i7 = 0, i9 = 0, i10 = 0, i12 = 0, i14 = 0, i15 = 0;
 i9 = i5;
 i4 = i6;
 i7 = i4;
 i2 = i8;
 i12 = i11;
 i3 = i12;
 if (!i7) {
  i1 = (i13 | 0) != 0;
  if (!i3) {
   if (i1) {
    HEAP32[i13 >> 2] = (i9 >>> 0) % (i2 >>> 0);
    HEAP32[i13 + 4 >> 2] = 0;
   }
   i12 = 0;
   i13 = (i9 >>> 0) / (i2 >>> 0) >>> 0;
   return (tempRet0 = i12, i13) | 0;
  } else {
   if (!i1) {
    i12 = 0;
    i13 = 0;
    return (tempRet0 = i12, i13) | 0;
   }
   HEAP32[i13 >> 2] = i5 | 0;
   HEAP32[i13 + 4 >> 2] = i6 & 0;
   i12 = 0;
   i13 = 0;
   return (tempRet0 = i12, i13) | 0;
  }
 }
 i1 = (i3 | 0) == 0;
 do if (i2) {
  if (!i1) {
   i1 = (Math_clz32(i3 | 0) | 0) - (Math_clz32(i7 | 0) | 0) | 0;
   if (i1 >>> 0 <= 31) {
    i10 = i1 + 1 | 0;
    i3 = 31 - i1 | 0;
    i6 = i1 - 31 >> 31;
    i2 = i10;
    i5 = i9 >>> (i10 >>> 0) & i6 | i7 << i3;
    i6 = i7 >>> (i10 >>> 0) & i6;
    i1 = 0;
    i3 = i9 << i3;
    break;
   }
   if (!i13) {
    i12 = 0;
    i13 = 0;
    return (tempRet0 = i12, i13) | 0;
   }
   HEAP32[i13 >> 2] = i5 | 0;
   HEAP32[i13 + 4 >> 2] = i4 | i6 & 0;
   i12 = 0;
   i13 = 0;
   return (tempRet0 = i12, i13) | 0;
  }
  i1 = i2 - 1 | 0;
  if (i1 & i2 | 0) {
   i3 = (Math_clz32(i2 | 0) | 0) + 33 - (Math_clz32(i7 | 0) | 0) | 0;
   i15 = 64 - i3 | 0;
   i10 = 32 - i3 | 0;
   i4 = i10 >> 31;
   i14 = i3 - 32 | 0;
   i6 = i14 >> 31;
   i2 = i3;
   i5 = i10 - 1 >> 31 & i7 >>> (i14 >>> 0) | (i7 << i10 | i9 >>> (i3 >>> 0)) & i6;
   i6 = i6 & i7 >>> (i3 >>> 0);
   i1 = i9 << i15 & i4;
   i3 = (i7 << i15 | i9 >>> (i14 >>> 0)) & i4 | i9 << i10 & i3 - 33 >> 31;
   break;
  }
  if (i13 | 0) {
   HEAP32[i13 >> 2] = i1 & i9;
   HEAP32[i13 + 4 >> 2] = 0;
  }
  if ((i2 | 0) == 1) {
   i14 = i4 | i6 & 0;
   i15 = i5 | 0 | 0;
   return (tempRet0 = i14, i15) | 0;
  } else {
   i15 = _llvm_cttz_i32(i2 | 0) | 0;
   i14 = i7 >>> (i15 >>> 0) | 0;
   i15 = i7 << 32 - i15 | i9 >>> (i15 >>> 0) | 0;
   return (tempRet0 = i14, i15) | 0;
  }
 } else {
  if (i1) {
   if (i13 | 0) {
    HEAP32[i13 >> 2] = (i7 >>> 0) % (i2 >>> 0);
    HEAP32[i13 + 4 >> 2] = 0;
   }
   i14 = 0;
   i15 = (i7 >>> 0) / (i2 >>> 0) >>> 0;
   return (tempRet0 = i14, i15) | 0;
  }
  if (!i9) {
   if (i13 | 0) {
    HEAP32[i13 >> 2] = 0;
    HEAP32[i13 + 4 >> 2] = (i7 >>> 0) % (i3 >>> 0);
   }
   i14 = 0;
   i15 = (i7 >>> 0) / (i3 >>> 0) >>> 0;
   return (tempRet0 = i14, i15) | 0;
  }
  i1 = i3 - 1 | 0;
  if (!(i1 & i3)) {
   if (i13 | 0) {
    HEAP32[i13 >> 2] = i5 | 0;
    HEAP32[i13 + 4 >> 2] = i1 & i7 | i6 & 0;
   }
   i14 = 0;
   i15 = i7 >>> ((_llvm_cttz_i32(i3 | 0) | 0) >>> 0);
   return (tempRet0 = i14, i15) | 0;
  }
  i1 = (Math_clz32(i3 | 0) | 0) - (Math_clz32(i7 | 0) | 0) | 0;
  if (i1 >>> 0 <= 30) {
   i6 = i1 + 1 | 0;
   i3 = 31 - i1 | 0;
   i2 = i6;
   i5 = i7 << i3 | i9 >>> (i6 >>> 0);
   i6 = i7 >>> (i6 >>> 0);
   i1 = 0;
   i3 = i9 << i3;
   break;
  }
  if (!i13) {
   i14 = 0;
   i15 = 0;
   return (tempRet0 = i14, i15) | 0;
  }
  HEAP32[i13 >> 2] = i5 | 0;
  HEAP32[i13 + 4 >> 2] = i4 | i6 & 0;
  i14 = 0;
  i15 = 0;
  return (tempRet0 = i14, i15) | 0;
 } while (0);
 if (!i2) {
  i7 = i3;
  i4 = 0;
  i3 = 0;
 } else {
  i10 = i8 | 0 | 0;
  i9 = i12 | i11 & 0;
  i7 = _i64Add(i10 | 0, i9 | 0, -1, -1) | 0;
  i8 = tempRet0;
  i4 = i3;
  i3 = 0;
  do {
   i11 = i4;
   i4 = i1 >>> 31 | i4 << 1;
   i1 = i3 | i1 << 1;
   i11 = i5 << 1 | i11 >>> 31 | 0;
   i12 = i5 >>> 31 | i6 << 1 | 0;
   _i64Subtract(i7 | 0, i8 | 0, i11 | 0, i12 | 0) | 0;
   i15 = tempRet0;
   i14 = i15 >> 31 | ((i15 | 0) < 0 ? -1 : 0) << 1;
   i3 = i14 & 1;
   i5 = _i64Subtract(i11 | 0, i12 | 0, i14 & i10 | 0, (((i15 | 0) < 0 ? -1 : 0) >> 31 | ((i15 | 0) < 0 ? -1 : 0) << 1) & i9 | 0) | 0;
   i6 = tempRet0;
   i2 = i2 - 1 | 0;
  } while ((i2 | 0) != 0);
  i7 = i4;
  i4 = 0;
 }
 i2 = 0;
 if (i13 | 0) {
  HEAP32[i13 >> 2] = i5;
  HEAP32[i13 + 4 >> 2] = i6;
 }
 i14 = (i1 | 0) >>> 31 | (i7 | i2) << 1 | (i2 << 1 | i1 >>> 31) & 0 | i4;
 i15 = (i1 << 1 | 0 >>> 31) & -2 | i3;
 return (tempRet0 = i14, i15) | 0;
}

function _pop_arg(i1, i2, i3) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 var i4 = 0, i5 = 0, d6 = 0.0;
 L1 : do if (i2 >>> 0 <= 20) do switch (i2 | 0) {
 case 9:
  {
   i4 = (HEAP32[i3 >> 2] | 0) + (4 - 1) & ~(4 - 1);
   i2 = HEAP32[i4 >> 2] | 0;
   HEAP32[i3 >> 2] = i4 + 4;
   HEAP32[i1 >> 2] = i2;
   break L1;
  }
 case 10:
  {
   i4 = (HEAP32[i3 >> 2] | 0) + (4 - 1) & ~(4 - 1);
   i2 = HEAP32[i4 >> 2] | 0;
   HEAP32[i3 >> 2] = i4 + 4;
   i4 = i1;
   HEAP32[i4 >> 2] = i2;
   HEAP32[i4 + 4 >> 2] = ((i2 | 0) < 0) << 31 >> 31;
   break L1;
  }
 case 11:
  {
   i4 = (HEAP32[i3 >> 2] | 0) + (4 - 1) & ~(4 - 1);
   i2 = HEAP32[i4 >> 2] | 0;
   HEAP32[i3 >> 2] = i4 + 4;
   i4 = i1;
   HEAP32[i4 >> 2] = i2;
   HEAP32[i4 + 4 >> 2] = 0;
   break L1;
  }
 case 12:
  {
   i4 = (HEAP32[i3 >> 2] | 0) + (8 - 1) & ~(8 - 1);
   i2 = i4;
   i5 = HEAP32[i2 >> 2] | 0;
   i2 = HEAP32[i2 + 4 >> 2] | 0;
   HEAP32[i3 >> 2] = i4 + 8;
   i4 = i1;
   HEAP32[i4 >> 2] = i5;
   HEAP32[i4 + 4 >> 2] = i2;
   break L1;
  }
 case 13:
  {
   i5 = (HEAP32[i3 >> 2] | 0) + (4 - 1) & ~(4 - 1);
   i4 = HEAP32[i5 >> 2] | 0;
   HEAP32[i3 >> 2] = i5 + 4;
   i4 = (i4 & 65535) << 16 >> 16;
   i5 = i1;
   HEAP32[i5 >> 2] = i4;
   HEAP32[i5 + 4 >> 2] = ((i4 | 0) < 0) << 31 >> 31;
   break L1;
  }
 case 14:
  {
   i5 = (HEAP32[i3 >> 2] | 0) + (4 - 1) & ~(4 - 1);
   i4 = HEAP32[i5 >> 2] | 0;
   HEAP32[i3 >> 2] = i5 + 4;
   i5 = i1;
   HEAP32[i5 >> 2] = i4 & 65535;
   HEAP32[i5 + 4 >> 2] = 0;
   break L1;
  }
 case 15:
  {
   i5 = (HEAP32[i3 >> 2] | 0) + (4 - 1) & ~(4 - 1);
   i4 = HEAP32[i5 >> 2] | 0;
   HEAP32[i3 >> 2] = i5 + 4;
   i4 = (i4 & 255) << 24 >> 24;
   i5 = i1;
   HEAP32[i5 >> 2] = i4;
   HEAP32[i5 + 4 >> 2] = ((i4 | 0) < 0) << 31 >> 31;
   break L1;
  }
 case 16:
  {
   i5 = (HEAP32[i3 >> 2] | 0) + (4 - 1) & ~(4 - 1);
   i4 = HEAP32[i5 >> 2] | 0;
   HEAP32[i3 >> 2] = i5 + 4;
   i5 = i1;
   HEAP32[i5 >> 2] = i4 & 255;
   HEAP32[i5 + 4 >> 2] = 0;
   break L1;
  }
 case 17:
  {
   i5 = (HEAP32[i3 >> 2] | 0) + (8 - 1) & ~(8 - 1);
   d6 = +HEAPF64[i5 >> 3];
   HEAP32[i3 >> 2] = i5 + 8;
   HEAPF64[i1 >> 3] = d6;
   break L1;
  }
 case 18:
  {
   i5 = (HEAP32[i3 >> 2] | 0) + (8 - 1) & ~(8 - 1);
   d6 = +HEAPF64[i5 >> 3];
   HEAP32[i3 >> 2] = i5 + 8;
   HEAPF64[i1 >> 3] = d6;
   break L1;
  }
 default:
  break L1;
 } while (0); while (0);
 return;
}

function ___stdio_write(i12, i2, i1) {
 i12 = i12 | 0;
 i2 = i2 | 0;
 i1 = i1 | 0;
 var i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i13 = 0, i14 = 0, i15 = 0;
 i15 = STACKTOP;
 STACKTOP = STACKTOP + 48 | 0;
 i11 = i15 + 16 | 0;
 i10 = i15;
 i7 = i15 + 32 | 0;
 i13 = i12 + 28 | 0;
 i6 = HEAP32[i13 >> 2] | 0;
 HEAP32[i7 >> 2] = i6;
 i14 = i12 + 20 | 0;
 i6 = (HEAP32[i14 >> 2] | 0) - i6 | 0;
 HEAP32[i7 + 4 >> 2] = i6;
 HEAP32[i7 + 8 >> 2] = i2;
 HEAP32[i7 + 12 >> 2] = i1;
 i8 = i12 + 60 | 0;
 i9 = i12 + 44 | 0;
 i5 = 2;
 i2 = i6 + i1 | 0;
 while (1) {
  if (!(HEAP32[906] | 0)) {
   HEAP32[i11 >> 2] = HEAP32[i8 >> 2];
   HEAP32[i11 + 4 >> 2] = i7;
   HEAP32[i11 + 8 >> 2] = i5;
   i4 = ___syscall_ret(___syscall146(146, i11 | 0) | 0) | 0;
  } else {
   _pthread_cleanup_push(9, i12 | 0);
   HEAP32[i10 >> 2] = HEAP32[i8 >> 2];
   HEAP32[i10 + 4 >> 2] = i7;
   HEAP32[i10 + 8 >> 2] = i5;
   i4 = ___syscall_ret(___syscall146(146, i10 | 0) | 0) | 0;
   _pthread_cleanup_pop(0);
  }
  if ((i2 | 0) == (i4 | 0)) {
   i2 = 6;
   break;
  }
  if ((i4 | 0) < 0) {
   i2 = 8;
   break;
  }
  i2 = i2 - i4 | 0;
  i3 = HEAP32[i7 + 4 >> 2] | 0;
  if (i4 >>> 0 <= i3 >>> 0) if ((i5 | 0) == 2) {
   HEAP32[i13 >> 2] = (HEAP32[i13 >> 2] | 0) + i4;
   i5 = 2;
   i6 = i7;
  } else i6 = i7; else {
   i6 = HEAP32[i9 >> 2] | 0;
   HEAP32[i13 >> 2] = i6;
   HEAP32[i14 >> 2] = i6;
   i4 = i4 - i3 | 0;
   i5 = i5 + -1 | 0;
   i6 = i7 + 8 | 0;
   i3 = HEAP32[i7 + 12 >> 2] | 0;
  }
  HEAP32[i6 >> 2] = (HEAP32[i6 >> 2] | 0) + i4;
  HEAP32[i6 + 4 >> 2] = i3 - i4;
  i7 = i6;
 }
 if ((i2 | 0) == 6) {
  i11 = HEAP32[i9 >> 2] | 0;
  HEAP32[i12 + 16 >> 2] = i11 + (HEAP32[i12 + 48 >> 2] | 0);
  i12 = i11;
  HEAP32[i13 >> 2] = i12;
  HEAP32[i14 >> 2] = i12;
 } else if ((i2 | 0) == 8) {
  HEAP32[i12 + 16 >> 2] = 0;
  HEAP32[i13 >> 2] = 0;
  HEAP32[i14 >> 2] = 0;
  HEAP32[i12 >> 2] = HEAP32[i12 >> 2] | 32;
  if ((i5 | 0) == 2) i1 = 0; else i1 = i1 - (HEAP32[i7 + 4 >> 2] | 0) | 0;
 }
 STACKTOP = i15;
 return i1 | 0;
}

function _memcpy(i3, i6, i1) {
 i3 = i3 | 0;
 i6 = i6 | 0;
 i1 = i1 | 0;
 var i2 = 0, i4 = 0, i5 = 0;
 if ((i1 | 0) >= 8192) return _emscripten_memcpy_big(i3 | 0, i6 | 0, i1 | 0) | 0;
 i5 = i3 | 0;
 i4 = i3 + i1 | 0;
 if ((i3 & 3) == (i6 & 3)) {
  while (i3 & 3) {
   if (!i1) return i5 | 0;
   HEAP8[i3 >> 0] = HEAP8[i6 >> 0] | 0;
   i3 = i3 + 1 | 0;
   i6 = i6 + 1 | 0;
   i1 = i1 - 1 | 0;
  }
  i1 = i4 & -4 | 0;
  i2 = i1 - 64 | 0;
  while ((i3 | 0) <= (i2 | 0)) {
   HEAP32[i3 >> 2] = HEAP32[i6 >> 2];
   HEAP32[i3 + 4 >> 2] = HEAP32[i6 + 4 >> 2];
   HEAP32[i3 + 8 >> 2] = HEAP32[i6 + 8 >> 2];
   HEAP32[i3 + 12 >> 2] = HEAP32[i6 + 12 >> 2];
   HEAP32[i3 + 16 >> 2] = HEAP32[i6 + 16 >> 2];
   HEAP32[i3 + 20 >> 2] = HEAP32[i6 + 20 >> 2];
   HEAP32[i3 + 24 >> 2] = HEAP32[i6 + 24 >> 2];
   HEAP32[i3 + 28 >> 2] = HEAP32[i6 + 28 >> 2];
   HEAP32[i3 + 32 >> 2] = HEAP32[i6 + 32 >> 2];
   HEAP32[i3 + 36 >> 2] = HEAP32[i6 + 36 >> 2];
   HEAP32[i3 + 40 >> 2] = HEAP32[i6 + 40 >> 2];
   HEAP32[i3 + 44 >> 2] = HEAP32[i6 + 44 >> 2];
   HEAP32[i3 + 48 >> 2] = HEAP32[i6 + 48 >> 2];
   HEAP32[i3 + 52 >> 2] = HEAP32[i6 + 52 >> 2];
   HEAP32[i3 + 56 >> 2] = HEAP32[i6 + 56 >> 2];
   HEAP32[i3 + 60 >> 2] = HEAP32[i6 + 60 >> 2];
   i3 = i3 + 64 | 0;
   i6 = i6 + 64 | 0;
  }
  while ((i3 | 0) < (i1 | 0)) {
   HEAP32[i3 >> 2] = HEAP32[i6 >> 2];
   i3 = i3 + 4 | 0;
   i6 = i6 + 4 | 0;
  }
 } else {
  i1 = i4 - 4 | 0;
  while ((i3 | 0) < (i1 | 0)) {
   HEAP8[i3 >> 0] = HEAP8[i6 >> 0] | 0;
   HEAP8[i3 + 1 >> 0] = HEAP8[i6 + 1 >> 0] | 0;
   HEAP8[i3 + 2 >> 0] = HEAP8[i6 + 2 >> 0] | 0;
   HEAP8[i3 + 3 >> 0] = HEAP8[i6 + 3 >> 0] | 0;
   i3 = i3 + 4 | 0;
   i6 = i6 + 4 | 0;
  }
 }
 while ((i3 | 0) < (i4 | 0)) {
  HEAP8[i3 >> 0] = HEAP8[i6 >> 0] | 0;
  i3 = i3 + 1 | 0;
  i6 = i6 + 1 | 0;
 }
 return i5 | 0;
}

function __ZNK10__cxxabiv120__si_class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib(i3, i6, i8, i2, i4) {
 i3 = i3 | 0;
 i6 = i6 | 0;
 i8 = i8 | 0;
 i2 = i2 | 0;
 i4 = i4 | 0;
 var i1 = 0, i5 = 0, i7 = 0;
 do if ((i3 | 0) == (HEAP32[i6 + 8 >> 2] | 0)) {
  if ((HEAP32[i6 + 4 >> 2] | 0) == (i8 | 0) ? (i1 = i6 + 28 | 0, (HEAP32[i1 >> 2] | 0) != 1) : 0) HEAP32[i1 >> 2] = i2;
 } else {
  if ((i3 | 0) != (HEAP32[i6 >> 2] | 0)) {
   i7 = HEAP32[i3 + 8 >> 2] | 0;
   FUNCTION_TABLE_viiiii[HEAP32[(HEAP32[i7 >> 2] | 0) + 24 >> 2] & 3](i7, i6, i8, i2, i4);
   break;
  }
  if ((HEAP32[i6 + 16 >> 2] | 0) != (i8 | 0) ? (i7 = i6 + 20 | 0, (HEAP32[i7 >> 2] | 0) != (i8 | 0)) : 0) {
   HEAP32[i6 + 32 >> 2] = i2;
   i5 = i6 + 44 | 0;
   if ((HEAP32[i5 >> 2] | 0) == 4) break;
   i1 = i6 + 52 | 0;
   HEAP8[i1 >> 0] = 0;
   i2 = i6 + 53 | 0;
   HEAP8[i2 >> 0] = 0;
   i3 = HEAP32[i3 + 8 >> 2] | 0;
   FUNCTION_TABLE_viiiiii[HEAP32[(HEAP32[i3 >> 2] | 0) + 20 >> 2] & 3](i3, i6, i8, i8, 1, i4);
   if (HEAP8[i2 >> 0] | 0) if (!(HEAP8[i1 >> 0] | 0)) {
    i1 = 1;
    i2 = 13;
   } else i2 = 17; else {
    i1 = 0;
    i2 = 13;
   }
   do if ((i2 | 0) == 13) {
    HEAP32[i7 >> 2] = i8;
    i8 = i6 + 40 | 0;
    HEAP32[i8 >> 2] = (HEAP32[i8 >> 2] | 0) + 1;
    if ((HEAP32[i6 + 36 >> 2] | 0) == 1 ? (HEAP32[i6 + 24 >> 2] | 0) == 2 : 0) {
     HEAP8[i6 + 54 >> 0] = 1;
     if (i1) {
      i2 = 17;
      break;
     } else {
      i1 = 4;
      break;
     }
    }
    if (i1) i2 = 17; else i1 = 4;
   } while (0);
   if ((i2 | 0) == 17) i1 = 3;
   HEAP32[i5 >> 2] = i1;
   break;
  }
  if ((i2 | 0) == 1) HEAP32[i6 + 32 >> 2] = 1;
 } while (0);
 return;
}

function ___dynamic_cast(i1, i2, i11, i3) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i11 = i11 | 0;
 i3 = i3 | 0;
 var i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i12 = 0, i13 = 0, i14 = 0;
 i14 = STACKTOP;
 STACKTOP = STACKTOP + 64 | 0;
 i12 = i14;
 i10 = HEAP32[i1 >> 2] | 0;
 i13 = i1 + (HEAP32[i10 + -8 >> 2] | 0) | 0;
 i10 = HEAP32[i10 + -4 >> 2] | 0;
 HEAP32[i12 >> 2] = i11;
 HEAP32[i12 + 4 >> 2] = i1;
 HEAP32[i12 + 8 >> 2] = i2;
 HEAP32[i12 + 12 >> 2] = i3;
 i1 = i12 + 16 | 0;
 i2 = i12 + 20 | 0;
 i3 = i12 + 24 | 0;
 i4 = i12 + 28 | 0;
 i5 = i12 + 32 | 0;
 i6 = i12 + 40 | 0;
 i7 = (i10 | 0) == (i11 | 0);
 i8 = i1;
 i9 = i8 + 36 | 0;
 do {
  HEAP32[i8 >> 2] = 0;
  i8 = i8 + 4 | 0;
 } while ((i8 | 0) < (i9 | 0));
 HEAP16[i1 + 36 >> 1] = 0;
 HEAP8[i1 + 38 >> 0] = 0;
 L1 : do if (i7) {
  HEAP32[i12 + 48 >> 2] = 1;
  FUNCTION_TABLE_viiiiii[HEAP32[(HEAP32[i11 >> 2] | 0) + 20 >> 2] & 3](i11, i12, i13, i13, 1, 0);
  i1 = (HEAP32[i3 >> 2] | 0) == 1 ? i13 : 0;
 } else {
  FUNCTION_TABLE_viiiii[HEAP32[(HEAP32[i10 >> 2] | 0) + 24 >> 2] & 3](i10, i12, i13, 1, 0);
  switch (HEAP32[i12 + 36 >> 2] | 0) {
  case 0:
   {
    i1 = (HEAP32[i6 >> 2] | 0) == 1 & (HEAP32[i4 >> 2] | 0) == 1 & (HEAP32[i5 >> 2] | 0) == 1 ? HEAP32[i2 >> 2] | 0 : 0;
    break L1;
   }
  case 1:
   break;
  default:
   {
    i1 = 0;
    break L1;
   }
  }
  if ((HEAP32[i3 >> 2] | 0) != 1 ? !((HEAP32[i6 >> 2] | 0) == 0 & (HEAP32[i4 >> 2] | 0) == 1 & (HEAP32[i5 >> 2] | 0) == 1) : 0) {
   i1 = 0;
   break;
  }
  i1 = HEAP32[i1 >> 2] | 0;
 } while (0);
 STACKTOP = i14;
 return i1 | 0;
}

function _vfprintf(i15, i8, i1) {
 i15 = i15 | 0;
 i8 = i8 | 0;
 i1 = i1 | 0;
 var i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i16 = 0;
 i16 = STACKTOP;
 STACKTOP = STACKTOP + 224 | 0;
 i10 = i16 + 120 | 0;
 i12 = i16 + 80 | 0;
 i13 = i16;
 i14 = i16 + 136 | 0;
 i2 = i12;
 i3 = i2 + 40 | 0;
 do {
  HEAP32[i2 >> 2] = 0;
  i2 = i2 + 4 | 0;
 } while ((i2 | 0) < (i3 | 0));
 HEAP32[i10 >> 2] = HEAP32[i1 >> 2];
 if ((_printf_core(0, i8, i10, i13, i12) | 0) < 0) i1 = -1; else {
  if ((HEAP32[i15 + 76 >> 2] | 0) > -1) i11 = ___lockfile(i15) | 0; else i11 = 0;
  i1 = HEAP32[i15 >> 2] | 0;
  i9 = i1 & 32;
  if ((HEAP8[i15 + 74 >> 0] | 0) < 1) HEAP32[i15 >> 2] = i1 & -33;
  i2 = i15 + 48 | 0;
  if (!(HEAP32[i2 >> 2] | 0)) {
   i3 = i15 + 44 | 0;
   i4 = HEAP32[i3 >> 2] | 0;
   HEAP32[i3 >> 2] = i14;
   i5 = i15 + 28 | 0;
   HEAP32[i5 >> 2] = i14;
   i6 = i15 + 20 | 0;
   HEAP32[i6 >> 2] = i14;
   HEAP32[i2 >> 2] = 80;
   i7 = i15 + 16 | 0;
   HEAP32[i7 >> 2] = i14 + 80;
   i1 = _printf_core(i15, i8, i10, i13, i12) | 0;
   if (i4) {
    FUNCTION_TABLE_iiii[HEAP32[i15 + 36 >> 2] & 7](i15, 0, 0) | 0;
    i1 = (HEAP32[i6 >> 2] | 0) == 0 ? -1 : i1;
    HEAP32[i3 >> 2] = i4;
    HEAP32[i2 >> 2] = 0;
    HEAP32[i7 >> 2] = 0;
    HEAP32[i5 >> 2] = 0;
    HEAP32[i6 >> 2] = 0;
   }
  } else i1 = _printf_core(i15, i8, i10, i13, i12) | 0;
  i2 = HEAP32[i15 >> 2] | 0;
  HEAP32[i15 >> 2] = i2 | i9;
  if (i11 | 0) ___unlockfile(i15);
  i1 = (i2 & 32 | 0) == 0 ? i1 : -1;
 }
 STACKTOP = i16;
 return i1 | 0;
}

function __ZL25default_terminate_handlerv() {
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0;
 i5 = STACKTOP;
 STACKTOP = STACKTOP + 48 | 0;
 i7 = i5 + 32 | 0;
 i3 = i5 + 24 | 0;
 i8 = i5 + 16 | 0;
 i6 = i5;
 i5 = i5 + 36 | 0;
 i1 = ___cxa_get_globals_fast() | 0;
 if (i1 | 0 ? (i4 = HEAP32[i1 >> 2] | 0, i4 | 0) : 0) {
  i1 = i4 + 48 | 0;
  i2 = HEAP32[i1 >> 2] | 0;
  i1 = HEAP32[i1 + 4 >> 2] | 0;
  if (!((i2 & -256 | 0) == 1126902528 & (i1 | 0) == 1129074247)) {
   HEAP32[i3 >> 2] = HEAP32[111];
   _abort_message(3089, i3);
  }
  if ((i2 | 0) == 1126902529 & (i1 | 0) == 1129074247) i1 = HEAP32[i4 + 44 >> 2] | 0; else i1 = i4 + 80 | 0;
  HEAP32[i5 >> 2] = i1;
  i4 = HEAP32[i4 >> 2] | 0;
  i1 = HEAP32[i4 + 4 >> 2] | 0;
  if (FUNCTION_TABLE_iiii[HEAP32[(HEAP32[4] | 0) + 16 >> 2] & 7](16, i4, i5) | 0) {
   i8 = HEAP32[i5 >> 2] | 0;
   i5 = HEAP32[111] | 0;
   i8 = FUNCTION_TABLE_ii[HEAP32[(HEAP32[i8 >> 2] | 0) + 8 >> 2] & 1](i8) | 0;
   HEAP32[i6 >> 2] = i5;
   HEAP32[i6 + 4 >> 2] = i1;
   HEAP32[i6 + 8 >> 2] = i8;
   _abort_message(3003, i6);
  } else {
   HEAP32[i8 >> 2] = HEAP32[111];
   HEAP32[i8 + 4 >> 2] = i1;
   _abort_message(3048, i8);
  }
 }
 _abort_message(3127, i7);
}

function _memchr(i2, i5, i1) {
 i2 = i2 | 0;
 i5 = i5 | 0;
 i1 = i1 | 0;
 var i3 = 0, i4 = 0, i6 = 0, i7 = 0;
 i6 = i5 & 255;
 i3 = (i1 | 0) != 0;
 L1 : do if (i3 & (i2 & 3 | 0) != 0) {
  i4 = i5 & 255;
  while (1) {
   if ((HEAP8[i2 >> 0] | 0) == i4 << 24 >> 24) {
    i7 = 6;
    break L1;
   }
   i2 = i2 + 1 | 0;
   i1 = i1 + -1 | 0;
   i3 = (i1 | 0) != 0;
   if (!(i3 & (i2 & 3 | 0) != 0)) {
    i7 = 5;
    break;
   }
  }
 } else i7 = 5; while (0);
 if ((i7 | 0) == 5) if (i3) i7 = 6; else i1 = 0;
 L8 : do if ((i7 | 0) == 6) {
  i4 = i5 & 255;
  if ((HEAP8[i2 >> 0] | 0) != i4 << 24 >> 24) {
   i3 = Math_imul(i6, 16843009) | 0;
   L11 : do if (i1 >>> 0 > 3) while (1) {
    i6 = HEAP32[i2 >> 2] ^ i3;
    if ((i6 & -2139062144 ^ -2139062144) & i6 + -16843009 | 0) break;
    i2 = i2 + 4 | 0;
    i1 = i1 + -4 | 0;
    if (i1 >>> 0 <= 3) {
     i7 = 11;
     break L11;
    }
   } else i7 = 11; while (0);
   if ((i7 | 0) == 11) if (!i1) {
    i1 = 0;
    break;
   }
   while (1) {
    if ((HEAP8[i2 >> 0] | 0) == i4 << 24 >> 24) break L8;
    i2 = i2 + 1 | 0;
    i1 = i1 + -1 | 0;
    if (!i1) {
     i1 = 0;
     break;
    }
   }
  }
 } while (0);
 return (i1 | 0 ? i2 : 0) | 0;
}

function ___fwritex(i3, i5, i6) {
 i3 = i3 | 0;
 i5 = i5 | 0;
 i6 = i6 | 0;
 var i1 = 0, i2 = 0, i4 = 0, i7 = 0;
 i1 = i6 + 16 | 0;
 i2 = HEAP32[i1 >> 2] | 0;
 if (!i2) if (!(___towrite(i6) | 0)) {
  i1 = HEAP32[i1 >> 2] | 0;
  i4 = 5;
 } else i1 = 0; else {
  i1 = i2;
  i4 = 5;
 }
 L5 : do if ((i4 | 0) == 5) {
  i7 = i6 + 20 | 0;
  i4 = HEAP32[i7 >> 2] | 0;
  i2 = i4;
  if ((i1 - i4 | 0) >>> 0 < i5 >>> 0) {
   i1 = FUNCTION_TABLE_iiii[HEAP32[i6 + 36 >> 2] & 7](i6, i3, i5) | 0;
   break;
  }
  L10 : do if ((HEAP8[i6 + 75 >> 0] | 0) > -1) {
   i1 = i5;
   while (1) {
    if (!i1) {
     i4 = i5;
     i1 = 0;
     break L10;
    }
    i4 = i1 + -1 | 0;
    if ((HEAP8[i3 + i4 >> 0] | 0) == 10) break; else i1 = i4;
   }
   if ((FUNCTION_TABLE_iiii[HEAP32[i6 + 36 >> 2] & 7](i6, i3, i1) | 0) >>> 0 < i1 >>> 0) break L5;
   i4 = i5 - i1 | 0;
   i3 = i3 + i1 | 0;
   i2 = HEAP32[i7 >> 2] | 0;
  } else {
   i4 = i5;
   i1 = 0;
  } while (0);
  _memcpy(i2 | 0, i3 | 0, i4 | 0) | 0;
  HEAP32[i7 >> 2] = (HEAP32[i7 >> 2] | 0) + i4;
  i1 = i1 + i4 | 0;
 } while (0);
 return i1 | 0;
}

function _memset(i5, i6, i4) {
 i5 = i5 | 0;
 i6 = i6 | 0;
 i4 = i4 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i7 = 0;
 i3 = i5 + i4 | 0;
 i6 = i6 & 255;
 if ((i4 | 0) >= 67) {
  while (i5 & 3) {
   HEAP8[i5 >> 0] = i6;
   i5 = i5 + 1 | 0;
  }
  i1 = i3 & -4 | 0;
  i2 = i1 - 64 | 0;
  i7 = i6 | i6 << 8 | i6 << 16 | i6 << 24;
  while ((i5 | 0) <= (i2 | 0)) {
   HEAP32[i5 >> 2] = i7;
   HEAP32[i5 + 4 >> 2] = i7;
   HEAP32[i5 + 8 >> 2] = i7;
   HEAP32[i5 + 12 >> 2] = i7;
   HEAP32[i5 + 16 >> 2] = i7;
   HEAP32[i5 + 20 >> 2] = i7;
   HEAP32[i5 + 24 >> 2] = i7;
   HEAP32[i5 + 28 >> 2] = i7;
   HEAP32[i5 + 32 >> 2] = i7;
   HEAP32[i5 + 36 >> 2] = i7;
   HEAP32[i5 + 40 >> 2] = i7;
   HEAP32[i5 + 44 >> 2] = i7;
   HEAP32[i5 + 48 >> 2] = i7;
   HEAP32[i5 + 52 >> 2] = i7;
   HEAP32[i5 + 56 >> 2] = i7;
   HEAP32[i5 + 60 >> 2] = i7;
   i5 = i5 + 64 | 0;
  }
  while ((i5 | 0) < (i1 | 0)) {
   HEAP32[i5 >> 2] = i7;
   i5 = i5 + 4 | 0;
  }
 }
 while ((i5 | 0) < (i3 | 0)) {
  HEAP8[i5 >> 0] = i6;
  i5 = i5 + 1 | 0;
 }
 return i3 - i4 | 0;
}

function __ZNK10__cxxabiv117__class_type_info29process_static_type_above_dstEPNS_19__dynamic_cast_infoEPKvS4_i(i1, i5, i3, i2, i4) {
 i1 = i1 | 0;
 i5 = i5 | 0;
 i3 = i3 | 0;
 i2 = i2 | 0;
 i4 = i4 | 0;
 HEAP8[i5 + 53 >> 0] = 1;
 do if ((HEAP32[i5 + 4 >> 2] | 0) == (i2 | 0)) {
  HEAP8[i5 + 52 >> 0] = 1;
  i1 = i5 + 16 | 0;
  i2 = HEAP32[i1 >> 2] | 0;
  if (!i2) {
   HEAP32[i1 >> 2] = i3;
   HEAP32[i5 + 24 >> 2] = i4;
   HEAP32[i5 + 36 >> 2] = 1;
   if (!((i4 | 0) == 1 ? (HEAP32[i5 + 48 >> 2] | 0) == 1 : 0)) break;
   HEAP8[i5 + 54 >> 0] = 1;
   break;
  }
  if ((i2 | 0) != (i3 | 0)) {
   i4 = i5 + 36 | 0;
   HEAP32[i4 >> 2] = (HEAP32[i4 >> 2] | 0) + 1;
   HEAP8[i5 + 54 >> 0] = 1;
   break;
  }
  i2 = i5 + 24 | 0;
  i1 = HEAP32[i2 >> 2] | 0;
  if ((i1 | 0) == 2) {
   HEAP32[i2 >> 2] = i4;
   i1 = i4;
  }
  if ((i1 | 0) == 1 ? (HEAP32[i5 + 48 >> 2] | 0) == 1 : 0) HEAP8[i5 + 54 >> 0] = 1;
 } while (0);
 return;
}

function __ZNK10__cxxabiv117__class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib(i1, i2, i5, i6, i7) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i5 = i5 | 0;
 i6 = i6 | 0;
 i7 = i7 | 0;
 var i3 = 0, i4 = 0;
 do if ((i1 | 0) == (HEAP32[i2 + 8 >> 2] | 0)) {
  if ((HEAP32[i2 + 4 >> 2] | 0) == (i5 | 0) ? (i3 = i2 + 28 | 0, (HEAP32[i3 >> 2] | 0) != 1) : 0) HEAP32[i3 >> 2] = i6;
 } else if ((i1 | 0) == (HEAP32[i2 >> 2] | 0)) {
  if ((HEAP32[i2 + 16 >> 2] | 0) != (i5 | 0) ? (i4 = i2 + 20 | 0, (HEAP32[i4 >> 2] | 0) != (i5 | 0)) : 0) {
   HEAP32[i2 + 32 >> 2] = i6;
   HEAP32[i4 >> 2] = i5;
   i7 = i2 + 40 | 0;
   HEAP32[i7 >> 2] = (HEAP32[i7 >> 2] | 0) + 1;
   if ((HEAP32[i2 + 36 >> 2] | 0) == 1 ? (HEAP32[i2 + 24 >> 2] | 0) == 2 : 0) HEAP8[i2 + 54 >> 0] = 1;
   HEAP32[i2 + 44 >> 2] = 4;
   break;
  }
  if ((i6 | 0) == 1) HEAP32[i2 + 32 >> 2] = 1;
 } while (0);
 return;
}

function __ZNK10__cxxabiv117__class_type_info9can_catchEPKNS_16__shim_type_infoERPv(i3, i1, i4) {
 i3 = i3 | 0;
 i1 = i1 | 0;
 i4 = i4 | 0;
 var i2 = 0, i5 = 0, i6 = 0, i7 = 0;
 i7 = STACKTOP;
 STACKTOP = STACKTOP + 64 | 0;
 i5 = i7;
 if ((i3 | 0) != (i1 | 0)) if ((i1 | 0) != 0 ? (i6 = ___dynamic_cast(i1, 40, 24, 0) | 0, (i6 | 0) != 0) : 0) {
  i1 = i5 + 4 | 0;
  i2 = i1 + 52 | 0;
  do {
   HEAP32[i1 >> 2] = 0;
   i1 = i1 + 4 | 0;
  } while ((i1 | 0) < (i2 | 0));
  HEAP32[i5 >> 2] = i6;
  HEAP32[i5 + 8 >> 2] = i3;
  HEAP32[i5 + 12 >> 2] = -1;
  HEAP32[i5 + 48 >> 2] = 1;
  FUNCTION_TABLE_viiii[HEAP32[(HEAP32[i6 >> 2] | 0) + 28 >> 2] & 3](i6, i5, HEAP32[i4 >> 2] | 0, 1);
  if ((HEAP32[i5 + 24 >> 2] | 0) == 1) {
   HEAP32[i4 >> 2] = HEAP32[i5 + 16 >> 2];
   i1 = 1;
  } else i1 = 0;
 } else i1 = 0; else i1 = 1;
 STACKTOP = i7;
 return i1 | 0;
}

function _wcrtomb(i1, i2, i3) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 do if (i1) {
  if (i2 >>> 0 < 128) {
   HEAP8[i1 >> 0] = i2;
   i1 = 1;
   break;
  }
  if (i2 >>> 0 < 2048) {
   HEAP8[i1 >> 0] = i2 >>> 6 | 192;
   HEAP8[i1 + 1 >> 0] = i2 & 63 | 128;
   i1 = 2;
   break;
  }
  if (i2 >>> 0 < 55296 | (i2 & -8192 | 0) == 57344) {
   HEAP8[i1 >> 0] = i2 >>> 12 | 224;
   HEAP8[i1 + 1 >> 0] = i2 >>> 6 & 63 | 128;
   HEAP8[i1 + 2 >> 0] = i2 & 63 | 128;
   i1 = 3;
   break;
  }
  if ((i2 + -65536 | 0) >>> 0 < 1048576) {
   HEAP8[i1 >> 0] = i2 >>> 18 | 240;
   HEAP8[i1 + 1 >> 0] = i2 >>> 12 & 63 | 128;
   HEAP8[i1 + 2 >> 0] = i2 >>> 6 & 63 | 128;
   HEAP8[i1 + 3 >> 0] = i2 & 63 | 128;
   i1 = 4;
   break;
  } else {
   HEAP32[(___errno_location() | 0) >> 2] = 84;
   i1 = -1;
   break;
  }
 } else i1 = 1; while (0);
 return i1 | 0;
}

function _fputc(i1, i6) {
 i1 = i1 | 0;
 i6 = i6 | 0;
 var i2 = 0, i3 = 0, i4 = 0, i5 = 0, i7 = 0;
 if ((HEAP32[i6 + 76 >> 2] | 0) >= 0 ? (___lockfile(i6) | 0) != 0 : 0) {
  if ((HEAP8[i6 + 75 >> 0] | 0) != (i1 | 0) ? (i4 = i6 + 20 | 0, i5 = HEAP32[i4 >> 2] | 0, i5 >>> 0 < (HEAP32[i6 + 16 >> 2] | 0) >>> 0) : 0) {
   HEAP32[i4 >> 2] = i5 + 1;
   HEAP8[i5 >> 0] = i1;
   i1 = i1 & 255;
  } else i1 = ___overflow(i6, i1) | 0;
  ___unlockfile(i6);
 } else i7 = 3;
 do if ((i7 | 0) == 3) {
  if ((HEAP8[i6 + 75 >> 0] | 0) != (i1 | 0) ? (i2 = i6 + 20 | 0, i3 = HEAP32[i2 >> 2] | 0, i3 >>> 0 < (HEAP32[i6 + 16 >> 2] | 0) >>> 0) : 0) {
   HEAP32[i2 >> 2] = i3 + 1;
   HEAP8[i3 >> 0] = i1;
   i1 = i1 & 255;
   break;
  }
  i1 = ___overflow(i6, i1) | 0;
 } while (0);
 return i1 | 0;
}

function ___overflow(i5, i6) {
 i5 = i5 | 0;
 i6 = i6 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i7 = 0, i8 = 0, i9 = 0;
 i9 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 i7 = i9;
 i8 = i6 & 255;
 HEAP8[i7 >> 0] = i8;
 i2 = i5 + 16 | 0;
 i3 = HEAP32[i2 >> 2] | 0;
 if (!i3) if (!(___towrite(i5) | 0)) {
  i3 = HEAP32[i2 >> 2] | 0;
  i4 = 4;
 } else i1 = -1; else i4 = 4;
 do if ((i4 | 0) == 4) {
  i4 = i5 + 20 | 0;
  i2 = HEAP32[i4 >> 2] | 0;
  if (i2 >>> 0 < i3 >>> 0 ? (i1 = i6 & 255, (i1 | 0) != (HEAP8[i5 + 75 >> 0] | 0)) : 0) {
   HEAP32[i4 >> 2] = i2 + 1;
   HEAP8[i2 >> 0] = i8;
   break;
  }
  if ((FUNCTION_TABLE_iiii[HEAP32[i5 + 36 >> 2] & 7](i5, i7, 1) | 0) == 1) i1 = HEAPU8[i7 >> 0] | 0; else i1 = -1;
 } while (0);
 STACKTOP = i9;
 return i1 | 0;
}

function _fflush(i2) {
 i2 = i2 | 0;
 var i1 = 0, i3 = 0;
 do if (i2) {
  if ((HEAP32[i2 + 76 >> 2] | 0) <= -1) {
   i1 = ___fflush_unlocked(i2) | 0;
   break;
  }
  i3 = (___lockfile(i2) | 0) == 0;
  i1 = ___fflush_unlocked(i2) | 0;
  if (!i3) ___unlockfile(i2);
 } else {
  if (!(HEAP32[109] | 0)) i1 = 0; else i1 = _fflush(HEAP32[109] | 0) | 0;
  ___lock(3652);
  i2 = HEAP32[912] | 0;
  if (i2) do {
   if ((HEAP32[i2 + 76 >> 2] | 0) > -1) i3 = ___lockfile(i2) | 0; else i3 = 0;
   if ((HEAP32[i2 + 20 >> 2] | 0) >>> 0 > (HEAP32[i2 + 28 >> 2] | 0) >>> 0) i1 = ___fflush_unlocked(i2) | 0 | i1;
   if (i3 | 0) ___unlockfile(i2);
   i2 = HEAP32[i2 + 56 >> 2] | 0;
  } while ((i2 | 0) != 0);
  ___unlock(3652);
 } while (0);
 return i1 | 0;
}

function _pad(i6, i2, i4, i5, i1) {
 i6 = i6 | 0;
 i2 = i2 | 0;
 i4 = i4 | 0;
 i5 = i5 | 0;
 i1 = i1 | 0;
 var i3 = 0, i7 = 0, i8 = 0;
 i8 = STACKTOP;
 STACKTOP = STACKTOP + 256 | 0;
 i7 = i8;
 do if ((i4 | 0) > (i5 | 0) & (i1 & 73728 | 0) == 0) {
  i1 = i4 - i5 | 0;
  _memset(i7 | 0, i2 | 0, (i1 >>> 0 > 256 ? 256 : i1) | 0) | 0;
  i2 = HEAP32[i6 >> 2] | 0;
  i3 = (i2 & 32 | 0) == 0;
  if (i1 >>> 0 > 255) {
   i4 = i4 - i5 | 0;
   do {
    if (i3) {
     ___fwritex(i7, 256, i6) | 0;
     i2 = HEAP32[i6 >> 2] | 0;
    }
    i1 = i1 + -256 | 0;
    i3 = (i2 & 32 | 0) == 0;
   } while (i1 >>> 0 > 255);
   if (i3) i1 = i4 & 255; else break;
  } else if (!i3) break;
  ___fwritex(i7, i1, i6) | 0;
 } while (0);
 STACKTOP = i8;
 return;
}

function _frexp(d1, i5) {
 d1 = +d1;
 i5 = i5 | 0;
 var i2 = 0, i3 = 0, i4 = 0;
 HEAPF64[tempDoublePtr >> 3] = d1;
 i2 = HEAP32[tempDoublePtr >> 2] | 0;
 i3 = HEAP32[tempDoublePtr + 4 >> 2] | 0;
 i4 = _bitshift64Lshr(i2 | 0, i3 | 0, 52) | 0;
 switch (i4 & 2047) {
 case 0:
  {
   if (d1 != 0.0) {
    d1 = +_frexp(d1 * 18446744073709552.0e3, i5);
    i2 = (HEAP32[i5 >> 2] | 0) + -64 | 0;
   } else i2 = 0;
   HEAP32[i5 >> 2] = i2;
   break;
  }
 case 2047:
  break;
 default:
  {
   HEAP32[i5 >> 2] = (i4 & 2047) + -1022;
   HEAP32[tempDoublePtr >> 2] = i2;
   HEAP32[tempDoublePtr + 4 >> 2] = i3 & -2146435073 | 1071644672;
   d1 = +HEAPF64[tempDoublePtr >> 3];
  }
 }
 return +d1;
}

function ___fflush_unlocked(i1) {
 i1 = i1 | 0;
 var i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0;
 i2 = i1 + 20 | 0;
 i7 = i1 + 28 | 0;
 if ((HEAP32[i2 >> 2] | 0) >>> 0 > (HEAP32[i7 >> 2] | 0) >>> 0 ? (FUNCTION_TABLE_iiii[HEAP32[i1 + 36 >> 2] & 7](i1, 0, 0) | 0, (HEAP32[i2 >> 2] | 0) == 0) : 0) i1 = -1; else {
  i3 = i1 + 4 | 0;
  i4 = HEAP32[i3 >> 2] | 0;
  i5 = i1 + 8 | 0;
  i6 = HEAP32[i5 >> 2] | 0;
  if (i4 >>> 0 < i6 >>> 0) FUNCTION_TABLE_iiii[HEAP32[i1 + 40 >> 2] & 7](i1, i4 - i6 | 0, 1) | 0;
  HEAP32[i1 + 16 >> 2] = 0;
  HEAP32[i7 >> 2] = 0;
  HEAP32[i2 >> 2] = 0;
  HEAP32[i5 >> 2] = 0;
  HEAP32[i3 >> 2] = 0;
  i1 = 0;
 }
 return i1 | 0;
}

function __ZNK10__cxxabiv117__class_type_info24process_found_base_classEPNS_19__dynamic_cast_infoEPvi(i1, i3, i4, i5) {
 i1 = i1 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 i5 = i5 | 0;
 var i2 = 0;
 i1 = i3 + 16 | 0;
 i2 = HEAP32[i1 >> 2] | 0;
 do if (i2) {
  if ((i2 | 0) != (i4 | 0)) {
   i5 = i3 + 36 | 0;
   HEAP32[i5 >> 2] = (HEAP32[i5 >> 2] | 0) + 1;
   HEAP32[i3 + 24 >> 2] = 2;
   HEAP8[i3 + 54 >> 0] = 1;
   break;
  }
  i1 = i3 + 24 | 0;
  if ((HEAP32[i1 >> 2] | 0) == 2) HEAP32[i1 >> 2] = i5;
 } else {
  HEAP32[i1 >> 2] = i4;
  HEAP32[i3 + 24 >> 2] = i5;
  HEAP32[i3 + 36 >> 2] = 1;
 } while (0);
 return;
}

function _fmt_u(i3, i2, i1) {
 i3 = i3 | 0;
 i2 = i2 | 0;
 i1 = i1 | 0;
 var i4 = 0;
 if (i2 >>> 0 > 0 | (i2 | 0) == 0 & i3 >>> 0 > 4294967295) {
  while (1) {
   i4 = ___uremdi3(i3 | 0, i2 | 0, 10, 0) | 0;
   i1 = i1 + -1 | 0;
   HEAP8[i1 >> 0] = i4 | 48;
   i4 = i3;
   i3 = ___udivdi3(i3 | 0, i2 | 0, 10, 0) | 0;
   if (!(i2 >>> 0 > 9 | (i2 | 0) == 9 & i4 >>> 0 > 4294967295)) break; else i2 = tempRet0;
  }
  i2 = i3;
 } else i2 = i3;
 if (i2) while (1) {
  i1 = i1 + -1 | 0;
  HEAP8[i1 >> 0] = (i2 >>> 0) % 10 | 0 | 48;
  if (i2 >>> 0 < 10) break; else i2 = (i2 >>> 0) / 10 | 0;
 }
 return i1 | 0;
}

function __ZNK10__cxxabiv120__si_class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib(i1, i2, i3, i4, i5, i6) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 i5 = i5 | 0;
 i6 = i6 | 0;
 if ((i1 | 0) == (HEAP32[i2 + 8 >> 2] | 0)) __ZNK10__cxxabiv117__class_type_info29process_static_type_above_dstEPNS_19__dynamic_cast_infoEPKvS4_i(0, i2, i3, i4, i5); else {
  i1 = HEAP32[i1 + 8 >> 2] | 0;
  FUNCTION_TABLE_viiiiii[HEAP32[(HEAP32[i1 >> 2] | 0) + 20 >> 2] & 3](i1, i2, i3, i4, i5, i6);
 }
 return;
}

function _strerror(i2) {
 i2 = i2 | 0;
 var i1 = 0, i3 = 0;
 i3 = 0;
 while (1) {
  if ((HEAPU8[1111 + i3 >> 0] | 0) == (i2 | 0)) {
   i2 = 2;
   break;
  }
  i1 = i3 + 1 | 0;
  if ((i1 | 0) == 87) {
   i1 = 1199;
   i3 = 87;
   i2 = 5;
   break;
  } else i3 = i1;
 }
 if ((i2 | 0) == 2) if (!i3) i1 = 1199; else {
  i1 = 1199;
  i2 = 5;
 }
 if ((i2 | 0) == 5) while (1) {
  do {
   i2 = i1;
   i1 = i1 + 1 | 0;
  } while ((HEAP8[i2 >> 0] | 0) != 0);
  i3 = i3 + -1 | 0;
  if (!i3) break; else i2 = 5;
 }
 return i1 | 0;
}

function ___stdio_seek(i1, i2, i3) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 var i4 = 0, i5 = 0, i6 = 0;
 i5 = STACKTOP;
 STACKTOP = STACKTOP + 32 | 0;
 i6 = i5;
 i4 = i5 + 20 | 0;
 HEAP32[i6 >> 2] = HEAP32[i1 + 60 >> 2];
 HEAP32[i6 + 4 >> 2] = 0;
 HEAP32[i6 + 8 >> 2] = i2;
 HEAP32[i6 + 12 >> 2] = i4;
 HEAP32[i6 + 16 >> 2] = i3;
 if ((___syscall_ret(___syscall140(140, i6 | 0) | 0) | 0) < 0) {
  HEAP32[i4 >> 2] = -1;
  i1 = -1;
 } else i1 = HEAP32[i4 >> 2] | 0;
 STACKTOP = i5;
 return i1 | 0;
}

function __ZNK10__cxxabiv120__si_class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi(i1, i2, i3, i4) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 if ((i1 | 0) == (HEAP32[i2 + 8 >> 2] | 0)) __ZNK10__cxxabiv117__class_type_info24process_found_base_classEPNS_19__dynamic_cast_infoEPvi(0, i2, i3, i4); else {
  i1 = HEAP32[i1 + 8 >> 2] | 0;
  FUNCTION_TABLE_viiii[HEAP32[(HEAP32[i1 >> 2] | 0) + 28 >> 2] & 3](i1, i2, i3, i4);
 }
 return;
}

function ___towrite(i1) {
 i1 = i1 | 0;
 var i2 = 0, i3 = 0;
 i2 = i1 + 74 | 0;
 i3 = HEAP8[i2 >> 0] | 0;
 HEAP8[i2 >> 0] = i3 + 255 | i3;
 i2 = HEAP32[i1 >> 2] | 0;
 if (!(i2 & 8)) {
  HEAP32[i1 + 8 >> 2] = 0;
  HEAP32[i1 + 4 >> 2] = 0;
  i3 = HEAP32[i1 + 44 >> 2] | 0;
  HEAP32[i1 + 28 >> 2] = i3;
  HEAP32[i1 + 20 >> 2] = i3;
  HEAP32[i1 + 16 >> 2] = i3 + (HEAP32[i1 + 48 >> 2] | 0);
  i1 = 0;
 } else {
  HEAP32[i1 >> 2] = i2 | 32;
  i1 = -1;
 }
 return i1 | 0;
}

function _sbrk(i1) {
 i1 = i1 | 0;
 var i2 = 0, i3 = 0;
 i3 = i1 + 15 & -16 | 0;
 i2 = HEAP32[DYNAMICTOP_PTR >> 2] | 0;
 i1 = i2 + i3 | 0;
 if ((i3 | 0) > 0 & (i1 | 0) < (i2 | 0) | (i1 | 0) < 0) {
  abortOnCannotGrowMemory() | 0;
  ___setErrNo(12);
  return -1;
 }
 HEAP32[DYNAMICTOP_PTR >> 2] = i1;
 if ((i1 | 0) > (getTotalMemory() | 0) ? (enlargeMemory() | 0) == 0 : 0) {
  ___setErrNo(12);
  HEAP32[DYNAMICTOP_PTR >> 2] = i2;
  return -1;
 }
 return i2 | 0;
}

function ___stdout_write(i1, i2, i3) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 var i4 = 0, i5 = 0;
 i5 = STACKTOP;
 STACKTOP = STACKTOP + 80 | 0;
 i4 = i5;
 HEAP32[i1 + 36 >> 2] = 1;
 if ((HEAP32[i1 >> 2] & 64 | 0) == 0 ? (HEAP32[i4 >> 2] = HEAP32[i1 + 60 >> 2], HEAP32[i4 + 4 >> 2] = 21505, HEAP32[i4 + 8 >> 2] = i5 + 12, ___syscall54(54, i4 | 0) | 0) : 0) HEAP8[i1 + 75 >> 0] = -1;
 i4 = ___stdio_write(i1, i2, i3) | 0;
 STACKTOP = i5;
 return i4 | 0;
}

function __Z3barv() {
 var i1 = 0, i2 = 0, i3 = 0;
 i2 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 i1 = i2;
 HEAP32[i1 >> 2] = 3;
 if ((HEAP32[HEAP32[35] >> 2] | 0) == 56) {
  HEAP32[899] = i1;
  i3 = __Z5foossv() | 0;
  HEAP32[HEAP32[35] >> 2] = i3;
  STACKTOP = i2;
  return HEAP32[i1 >> 2] | 0;
 } else {
  i3 = ___cxa_allocate_exception(4) | 0;
  HEAP32[i3 >> 2] = 55;
  ___cxa_throw(i3 | 0, 128, 0);
 }
 return 0;
}

function _main() {
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0;
 i1 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 i2 = i1;
 i4 = __Z3barv() | 0;
 HEAP32[HEAP32[47] >> 2] = i4;
 i4 = __Z3foov() | 0;
 HEAP32[HEAP32[48] >> 2] = i4;
 i4 = __Z4foo2v() | 0;
 i3 = HEAP32[48] | 0;
 HEAP32[i3 >> 2] = (HEAP32[i3 >> 2] | 0) + i4;
 HEAP32[i2 >> 2] = (HEAP32[44] | 0) + (HEAP32[46] | 0);
 _printf(573, i2) | 0;
 STACKTOP = i1;
 return 0;
}

function __ZNK10__cxxabiv117__class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib(i1, i2, i3, i4, i5, i6) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 i5 = i5 | 0;
 i6 = i6 | 0;
 if ((i1 | 0) == (HEAP32[i2 + 8 >> 2] | 0)) __ZNK10__cxxabiv117__class_type_info29process_static_type_above_dstEPNS_19__dynamic_cast_infoEPKvS4_i(0, i2, i3, i4, i5);
 return;
}

function _llvm_cttz_i32(i2) {
 i2 = i2 | 0;
 var i1 = 0;
 i1 = HEAP8[cttz_i8 + (i2 & 255) >> 0] | 0;
 if ((i1 | 0) < 8) return i1 | 0;
 i1 = HEAP8[cttz_i8 + (i2 >> 8 & 255) >> 0] | 0;
 if ((i1 | 0) < 8) return i1 + 8 | 0;
 i1 = HEAP8[cttz_i8 + (i2 >> 16 & 255) >> 0] | 0;
 if ((i1 | 0) < 8) return i1 + 16 | 0;
 return (HEAP8[cttz_i8 + (i2 >>> 24) >> 0] | 0) + 24 | 0;
}

function __ZSt9terminatev() {
 var i1 = 0, i2 = 0;
 i1 = ___cxa_get_globals_fast() | 0;
 if ((i1 | 0 ? (i2 = HEAP32[i1 >> 2] | 0, i2 | 0) : 0) ? (i1 = i2 + 48 | 0, (HEAP32[i1 >> 2] & -256 | 0) == 1126902528 ? (HEAP32[i1 + 4 >> 2] | 0) == 1129074247 : 0) : 0) __ZSt11__terminatePFvvE(HEAP32[i2 + 12 >> 2] | 0);
 __ZSt11__terminatePFvvE(__ZSt13get_terminatev() | 0);
}

function ___cxa_can_catch(i1, i2, i3) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 var i4 = 0, i5 = 0;
 i5 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 i4 = i5;
 HEAP32[i4 >> 2] = HEAP32[i3 >> 2];
 i1 = FUNCTION_TABLE_iiii[HEAP32[(HEAP32[i1 >> 2] | 0) + 16 >> 2] & 7](i1, i2, i4) | 0;
 if (i1) HEAP32[i3 >> 2] = HEAP32[i4 >> 2];
 STACKTOP = i5;
 return i1 & 1 | 0;
}

function __ZNK10__cxxabiv117__class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi(i1, i2, i3, i4) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 if ((i1 | 0) == (HEAP32[i2 + 8 >> 2] | 0)) __ZNK10__cxxabiv117__class_type_info24process_found_base_classEPNS_19__dynamic_cast_infoEPvi(0, i2, i3, i4);
 return;
}

function ___uremdi3(i1, i2, i3, i4) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 var i5 = 0, i6 = 0;
 i6 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 i5 = i6 | 0;
 ___udivmoddi4(i1, i2, i3, i4, i5) | 0;
 STACKTOP = i6;
 return (tempRet0 = HEAP32[i5 + 4 >> 2] | 0, HEAP32[i5 >> 2] | 0) | 0;
}

function ___cxa_get_globals_fast() {
 var i1 = 0, i2 = 0;
 i1 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 if (!(_pthread_once(4168, 2) | 0)) {
  i2 = _pthread_getspecific(HEAP32[1043] | 0) | 0;
  STACKTOP = i1;
  return i2 | 0;
 } else _abort_message(3278, i1);
 return 0;
}

function __ZN10__cxxabiv112_GLOBAL__N_19destruct_EPv(i1) {
 i1 = i1 | 0;
 var i2 = 0;
 i2 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 _free(i1);
 if (!(_pthread_setspecific(HEAP32[1043] | 0, 0) | 0)) {
  STACKTOP = i2;
  return;
 } else _abort_message(3377, i2);
}

function __Z5foossv() {
 var i1 = 0;
 if ((HEAP32[HEAP32[35] >> 2] | 0) == 56) {
  HEAP32[34] = __Z10foo_headerv() | 0;
  return 5;
 } else {
  i1 = ___cxa_allocate_exception(4) | 0;
  HEAP32[i1 >> 2] = 55;
  ___cxa_throw(i1 | 0, 128, 0);
 }
 return 0;
}

function __Z4foo2v() {
 var i1 = 0;
 if ((HEAP32[HEAP32[50] >> 2] | 0) == 56) {
  HEAP32[49] = __Z10foo_headerv() | 0;
  return 5;
 } else {
  i1 = ___cxa_allocate_exception(4) | 0;
  HEAP32[i1 >> 2] = 55;
  ___cxa_throw(i1 | 0, 128, 0);
 }
 return 0;
}

function __Z3foov() {
 var i1 = 0;
 if ((HEAP32[HEAP32[35] >> 2] | 0) == 56) {
  HEAP32[34] = __Z10foo_headerv() | 0;
  return 5;
 } else {
  i1 = ___cxa_allocate_exception(4) | 0;
  HEAP32[i1 >> 2] = 55;
  ___cxa_throw(i1 | 0, 128, 0);
 }
 return 0;
}

function ___stdio_close(i1) {
 i1 = i1 | 0;
 var i2 = 0, i3 = 0;
 i2 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 i3 = i2;
 HEAP32[i3 >> 2] = HEAP32[i1 + 60 >> 2];
 i1 = ___syscall_ret(___syscall6(6, i3 | 0) | 0) | 0;
 STACKTOP = i2;
 return i1 | 0;
}

function dynCall_viiiiii(i7, i1, i2, i3, i4, i5, i6) {
 i7 = i7 | 0;
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 i5 = i5 | 0;
 i6 = i6 | 0;
 FUNCTION_TABLE_viiiiii[i7 & 3](i1 | 0, i2 | 0, i3 | 0, i4 | 0, i5 | 0, i6 | 0);
}

function _printf(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 var i3 = 0, i4 = 0;
 i3 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 i4 = i3;
 HEAP32[i4 >> 2] = i2;
 i2 = _vfprintf(HEAP32[80] | 0, i1, i4) | 0;
 STACKTOP = i3;
 return i2 | 0;
}

function _bitshift64Shl(i3, i2, i1) {
 i3 = i3 | 0;
 i2 = i2 | 0;
 i1 = i1 | 0;
 if ((i1 | 0) < 32) {
  tempRet0 = i2 << i1 | (i3 & (1 << i1) - 1 << 32 - i1) >>> 32 - i1;
  return i3 << i1;
 }
 tempRet0 = i3 << i1 - 32;
 return 0;
}

function _bitshift64Lshr(i3, i2, i1) {
 i3 = i3 | 0;
 i2 = i2 | 0;
 i1 = i1 | 0;
 if ((i1 | 0) < 32) {
  tempRet0 = i2 >>> i1;
  return i3 >>> i1 | (i2 & (1 << i1) - 1) << 32 - i1;
 }
 tempRet0 = 0;
 return i2 >>> i1 - 32 | 0;
}

function _abort_message(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 var i3 = 0;
 i3 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 HEAP32[i3 >> 2] = i2;
 i2 = HEAP32[51] | 0;
 _vfprintf(i2, i1, i3) | 0;
 _fputc(10, i2) | 0;
 _abort();
}

function __ZN10__cxxabiv112_GLOBAL__N_110construct_Ev() {
 var i1 = 0;
 i1 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 if (!(_pthread_key_create(4172, 10) | 0)) {
  STACKTOP = i1;
  return;
 } else _abort_message(3327, i1);
}

function runPostSets() {}
function _i64Subtract(i1, i2, i3, i4) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 i4 = i2 - i4 - (i3 >>> 0 > i1 >>> 0 | 0) >>> 0;
 return (tempRet0 = i4, i1 - i3 >>> 0 | 0) | 0;
}

function __Z10foo_headerv() {
 var i1 = 0;
 if ((HEAP32[HEAP32[35] >> 2] | 0) == 56) return 5; else {
  i1 = ___cxa_allocate_exception(4) | 0;
  HEAP32[i1 >> 2] = 55;
  ___cxa_throw(i1 | 0, 128, 0);
 }
 return 0;
}

function dynCall_viiiii(i6, i1, i2, i3, i4, i5) {
 i6 = i6 | 0;
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 i5 = i5 | 0;
 FUNCTION_TABLE_viiiii[i6 & 3](i1 | 0, i2 | 0, i3 | 0, i4 | 0, i5 | 0);
}

function _i64Add(i1, i2, i3, i4) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 i3 = i1 + i3 >>> 0;
 return (tempRet0 = i2 + i4 + (i3 >>> 0 < i1 >>> 0 | 0) >>> 0, i3 | 0) | 0;
}

function __GLOBAL__sub_I_test4_cpp() {
 HEAP32[903] = __Z16generic_categoryv() | 0;
 HEAP32[904] = __Z16generic_categoryv() | 0;
 HEAP32[905] = __Z15system_categoryv() | 0;
 return;
}

function __GLOBAL__sub_I_test3_cpp() {
 HEAP32[900] = __Z16generic_categoryv() | 0;
 HEAP32[901] = __Z16generic_categoryv() | 0;
 HEAP32[902] = __Z15system_categoryv() | 0;
 return;
}

function __GLOBAL__sub_I_test1_cpp() {
 HEAP32[896] = __Z16generic_categoryv() | 0;
 HEAP32[897] = __Z16generic_categoryv() | 0;
 HEAP32[898] = __Z15system_categoryv() | 0;
 return;
}

function __ZNK10__cxxabiv123__fundamental_type_info9can_catchEPKNS_16__shim_type_infoERPv(i1, i2, i3) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 return (i1 | 0) == (i2 | 0) | 0;
}

function dynCall_viiii(i5, i1, i2, i3, i4) {
 i5 = i5 | 0;
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 FUNCTION_TABLE_viiii[i5 & 3](i1 | 0, i2 | 0, i3 | 0, i4 | 0);
}

function __ZSt11__terminatePFvvE(i1) {
 i1 = i1 | 0;
 var i2 = 0;
 i2 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 FUNCTION_TABLE_v[i1 & 3]();
 _abort_message(3430, i2);
}

function dynCall_iiii(i4, i1, i2, i3) {
 i4 = i4 | 0;
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 return FUNCTION_TABLE_iiii[i4 & 7](i1 | 0, i2 | 0, i3 | 0) | 0;
}

function ___syscall_ret(i1) {
 i1 = i1 | 0;
 if (i1 >>> 0 > 4294963200) {
  HEAP32[(___errno_location() | 0) >> 2] = 0 - i1;
  i1 = -1;
 }
 return i1 | 0;
}

function ___errno_location() {
 var i1 = 0;
 if (!(HEAP32[906] | 0)) i1 = 3668; else i1 = HEAP32[(_pthread_self() | 0) + 64 >> 2] | 0;
 return i1 | 0;
}
function stackAlloc(i1) {
 i1 = i1 | 0;
 var i2 = 0;
 i2 = STACKTOP;
 STACKTOP = STACKTOP + i1 | 0;
 STACKTOP = STACKTOP + 15 & -16;
 return i2 | 0;
}

function ___cxa_is_pointer_type(i1) {
 i1 = i1 | 0;
 if (!i1) i1 = 0; else i1 = (___dynamic_cast(i1, 40, 96, 0) | 0) != 0;
 return i1 & 1 | 0;
}

function ___udivdi3(i1, i2, i3, i4) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 return ___udivmoddi4(i1, i2, i3, i4, 0) | 0;
}

function b5(i1, i2, i3, i4, i5, i6) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 i5 = i5 | 0;
 i6 = i6 | 0;
 abort(5);
}

function _wctomb(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 if (!i1) i1 = 0; else i1 = _wcrtomb(i1, i2, 0) | 0;
 return i1 | 0;
}

function setThrew(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 if (!__THREW__) {
  __THREW__ = i1;
  threwValue = i2;
 }
}

function b1(i1, i2, i3, i4, i5) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 i5 = i5 | 0;
 abort(1);
}

function __ZSt13get_terminatev() {
 var i1 = 0;
 i1 = HEAP32[110] | 0;
 HEAP32[110] = i1 + 0;
 return i1 | 0;
}

function ___clang_call_terminate(i1) {
 i1 = i1 | 0;
 ___cxa_begin_catch(i1 | 0) | 0;
 __ZSt9terminatev();
}

function dynCall_ii(i2, i1) {
 i2 = i2 | 0;
 i1 = i1 | 0;
 return FUNCTION_TABLE_ii[i2 & 1](i1 | 0) | 0;
}

function _cleanup_522(i1) {
 i1 = i1 | 0;
 if (!(HEAP32[i1 + 68 >> 2] | 0)) ___unlockfile(i1);
 return;
}

function establishStackSpace(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 STACKTOP = i1;
 STACK_MAX = i2;
}

function __ZN10__cxxabiv123__fundamental_type_infoD0Ev(i1) {
 i1 = i1 | 0;
 __ZdlPv(i1);
 return;
}

function b6(i1, i2, i3, i4) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 abort(6);
}

function dynCall_vi(i2, i1) {
 i2 = i2 | 0;
 i1 = i1 | 0;
 FUNCTION_TABLE_vi[i2 & 15](i1 | 0);
}

function __ZN10__cxxabiv120__si_class_type_infoD0Ev(i1) {
 i1 = i1 | 0;
 __ZdlPv(i1);
 return;
}

function __ZN10__cxxabiv117__class_type_infoD0Ev(i1) {
 i1 = i1 | 0;
 __ZdlPv(i1);
 return;
}

function b0(i1, i2, i3) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 abort(0);
 return 0;
}

function __ZNK10__cxxabiv116__shim_type_info5noop2Ev(i1) {
 i1 = i1 | 0;
 return;
}

function __ZNK10__cxxabiv116__shim_type_info5noop1Ev(i1) {
 i1 = i1 | 0;
 return;
}

function _frexpl(d1, i2) {
 d1 = +d1;
 i2 = i2 | 0;
 return +(+_frexp(d1, i2));
}

function __ZN14error_categoryD0Ev(i1) {
 i1 = i1 | 0;
 __ZdlPv(i1);
 return;
}

function __ZN10__cxxabiv116__shim_type_infoD2Ev(i1) {
 i1 = i1 | 0;
 return;
}

function dynCall_v(i1) {
 i1 = i1 | 0;
 FUNCTION_TABLE_v[i1 & 3]();
}

function __ZN14error_categoryD2Ev(i1) {
 i1 = i1 | 0;
 return;
}

function __ZNSt9type_infoD2Ev(i1) {
 i1 = i1 | 0;
 return;
}

function stackRestore(i1) {
 i1 = i1 | 0;
 STACKTOP = i1;
}

function __ZdlPv(i1) {
 i1 = i1 | 0;
 _free(i1);
 return;
}

function setTempRet0(i1) {
 i1 = i1 | 0;
 tempRet0 = i1;
}

function b3(i1) {
 i1 = i1 | 0;
 abort(3);
 return 0;
}

function ___unlockfile(i1) {
 i1 = i1 | 0;
 return;
}

function ___lockfile(i1) {
 i1 = i1 | 0;
 return 0;
}

function __Z16generic_categoryv() {
 return 144;
}

function __Z15system_categoryv() {
 return 164;
}

function getTempRet0() {
 return tempRet0 | 0;
}

function stackSave() {
 return STACKTOP | 0;
}

function b2(i1) {
 i1 = i1 | 0;
 abort(2);
}

function _pthread_self() {
 return 0;
}

function b4() {
 abort(4);
}

// EMSCRIPTEN_END_FUNCS
var FUNCTION_TABLE_iiii = [b0,___stdio_write,___stdio_seek,___stdout_write,__ZNK10__cxxabiv117__class_type_info9can_catchEPKNS_16__shim_type_infoERPv,__ZNK10__cxxabiv123__fundamental_type_info9can_catchEPKNS_16__shim_type_infoERPv,b0,b0];
var FUNCTION_TABLE_viiiii = [b1,__ZNK10__cxxabiv117__class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib,__ZNK10__cxxabiv120__si_class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib,b1];
var FUNCTION_TABLE_vi = [b2,__ZN14error_categoryD2Ev,__ZN14error_categoryD0Ev,__ZN10__cxxabiv116__shim_type_infoD2Ev,__ZN10__cxxabiv117__class_type_infoD0Ev,__ZNK10__cxxabiv116__shim_type_info5noop1Ev,__ZNK10__cxxabiv116__shim_type_info5noop2Ev,__ZN10__cxxabiv120__si_class_type_infoD0Ev,__ZN10__cxxabiv123__fundamental_type_infoD0Ev,_cleanup_522,__ZN10__cxxabiv112_GLOBAL__N_19destruct_EPv,b2,b2,b2,b2,b2];
var FUNCTION_TABLE_ii = [b3,___stdio_close];
var FUNCTION_TABLE_v = [b4,__ZL25default_terminate_handlerv,__ZN10__cxxabiv112_GLOBAL__N_110construct_Ev,b4];
var FUNCTION_TABLE_viiiiii = [b5,__ZNK10__cxxabiv117__class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib,__ZNK10__cxxabiv120__si_class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib,b5];
var FUNCTION_TABLE_viiii = [b6,__ZNK10__cxxabiv117__class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi,__ZNK10__cxxabiv120__si_class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi,b6];

  return { _llvm_cttz_i32: _llvm_cttz_i32, ___cxa_can_catch: ___cxa_can_catch, _free: _free, _main: _main, ___cxa_is_pointer_type: ___cxa_is_pointer_type, _i64Add: _i64Add, _pthread_self: _pthread_self, _i64Subtract: _i64Subtract, _memset: _memset, _malloc: _malloc, _memcpy: _memcpy, _sbrk: _sbrk, _bitshift64Lshr: _bitshift64Lshr, _fflush: _fflush, ___udivdi3: ___udivdi3, ___uremdi3: ___uremdi3, _bitshift64Shl: _bitshift64Shl, ___errno_location: ___errno_location, ___udivmoddi4: ___udivmoddi4, __GLOBAL__sub_I_test1_cpp: __GLOBAL__sub_I_test1_cpp, __GLOBAL__sub_I_test3_cpp: __GLOBAL__sub_I_test3_cpp, __GLOBAL__sub_I_test4_cpp: __GLOBAL__sub_I_test4_cpp, runPostSets: runPostSets, stackAlloc: stackAlloc, stackSave: stackSave, stackRestore: stackRestore, establishStackSpace: establishStackSpace, setTempRet0: setTempRet0, getTempRet0: getTempRet0, setThrew: setThrew, stackAlloc: stackAlloc, stackSave: stackSave, stackRestore: stackRestore, establishStackSpace: establishStackSpace, setThrew: setThrew, setTempRet0: setTempRet0, getTempRet0: getTempRet0, dynCall_iiii: dynCall_iiii, dynCall_viiiii: dynCall_viiiii, dynCall_vi: dynCall_vi, dynCall_ii: dynCall_ii, dynCall_v: dynCall_v, dynCall_viiiiii: dynCall_viiiiii, dynCall_viiii: dynCall_viiii };
})
// EMSCRIPTEN_END_ASM
(Module.asmGlobalArg, Module.asmLibraryArg, buffer);
var _main = Module["_main"] = asm["_main"];
var stackSave = Module["stackSave"] = asm["stackSave"];
var getTempRet0 = Module["getTempRet0"] = asm["getTempRet0"];
var _memset = Module["_memset"] = asm["_memset"];
var setThrew = Module["setThrew"] = asm["setThrew"];
var _bitshift64Lshr = Module["_bitshift64Lshr"] = asm["_bitshift64Lshr"];
var _bitshift64Shl = Module["_bitshift64Shl"] = asm["_bitshift64Shl"];
var _fflush = Module["_fflush"] = asm["_fflush"];
var ___cxa_is_pointer_type = Module["___cxa_is_pointer_type"] = asm["___cxa_is_pointer_type"];
var _llvm_cttz_i32 = Module["_llvm_cttz_i32"] = asm["_llvm_cttz_i32"];
var _sbrk = Module["_sbrk"] = asm["_sbrk"];
var _memcpy = Module["_memcpy"] = asm["_memcpy"];
var stackAlloc = Module["stackAlloc"] = asm["stackAlloc"];
var ___uremdi3 = Module["___uremdi3"] = asm["___uremdi3"];
var _i64Subtract = Module["_i64Subtract"] = asm["_i64Subtract"];
var ___udivmoddi4 = Module["___udivmoddi4"] = asm["___udivmoddi4"];
var setTempRet0 = Module["setTempRet0"] = asm["setTempRet0"];
var _i64Add = Module["_i64Add"] = asm["_i64Add"];
var __GLOBAL__sub_I_test1_cpp = Module["__GLOBAL__sub_I_test1_cpp"] = asm["__GLOBAL__sub_I_test1_cpp"];
var _pthread_self = Module["_pthread_self"] = asm["_pthread_self"];
var __GLOBAL__sub_I_test4_cpp = Module["__GLOBAL__sub_I_test4_cpp"] = asm["__GLOBAL__sub_I_test4_cpp"];
var stackRestore = Module["stackRestore"] = asm["stackRestore"];
var __GLOBAL__sub_I_test3_cpp = Module["__GLOBAL__sub_I_test3_cpp"] = asm["__GLOBAL__sub_I_test3_cpp"];
var ___udivdi3 = Module["___udivdi3"] = asm["___udivdi3"];
var ___errno_location = Module["___errno_location"] = asm["___errno_location"];
var ___cxa_can_catch = Module["___cxa_can_catch"] = asm["___cxa_can_catch"];
var _free = Module["_free"] = asm["_free"];
var runPostSets = Module["runPostSets"] = asm["runPostSets"];
var establishStackSpace = Module["establishStackSpace"] = asm["establishStackSpace"];
var _malloc = Module["_malloc"] = asm["_malloc"];
var dynCall_iiii = Module["dynCall_iiii"] = asm["dynCall_iiii"];
var dynCall_viiiii = Module["dynCall_viiiii"] = asm["dynCall_viiiii"];
var dynCall_vi = Module["dynCall_vi"] = asm["dynCall_vi"];
var dynCall_ii = Module["dynCall_ii"] = asm["dynCall_ii"];
var dynCall_v = Module["dynCall_v"] = asm["dynCall_v"];
var dynCall_viiiiii = Module["dynCall_viiiiii"] = asm["dynCall_viiiiii"];
var dynCall_viiii = Module["dynCall_viiii"] = asm["dynCall_viiii"];
Runtime.stackAlloc = Module["stackAlloc"];
Runtime.stackSave = Module["stackSave"];
Runtime.stackRestore = Module["stackRestore"];
Runtime.establishStackSpace = Module["establishStackSpace"];
Runtime.setTempRet0 = Module["setTempRet0"];
Runtime.getTempRet0 = Module["getTempRet0"];
Module["asm"] = asm;
if (memoryInitializer) {
 if (typeof Module["locateFile"] === "function") {
  memoryInitializer = Module["locateFile"](memoryInitializer);
 } else if (Module["memoryInitializerPrefixURL"]) {
  memoryInitializer = Module["memoryInitializerPrefixURL"] + memoryInitializer;
 }
 if (ENVIRONMENT_IS_NODE || ENVIRONMENT_IS_SHELL) {
  var data = Module["readBinary"](memoryInitializer);
  HEAPU8.set(data, Runtime.GLOBAL_BASE);
 } else {
  addRunDependency("memory initializer");
  var applyMemoryInitializer = (function(data) {
   if (data.byteLength) data = new Uint8Array(data);
   HEAPU8.set(data, Runtime.GLOBAL_BASE);
   if (Module["memoryInitializerRequest"]) delete Module["memoryInitializerRequest"].response;
   removeRunDependency("memory initializer");
  });
  function doBrowserLoad() {
   Module["readAsync"](memoryInitializer, applyMemoryInitializer, (function() {
    throw "could not load memory initializer " + memoryInitializer;
   }));
  }
  if (Module["memoryInitializerRequest"]) {
   function useRequest() {
    var request = Module["memoryInitializerRequest"];
    if (request.status !== 200 && request.status !== 0) {
     console.warn("a problem seems to have happened with Module.memoryInitializerRequest, status: " + request.status + ", retrying " + memoryInitializer);
     doBrowserLoad();
     return;
    }
    applyMemoryInitializer(request.response);
   }
   if (Module["memoryInitializerRequest"].response) {
    setTimeout(useRequest, 0);
   } else {
    Module["memoryInitializerRequest"].addEventListener("load", useRequest);
   }
  } else {
   doBrowserLoad();
  }
 }
}
function ExitStatus(status) {
 this.name = "ExitStatus";
 this.message = "Program terminated with exit(" + status + ")";
 this.status = status;
}
ExitStatus.prototype = new Error;
ExitStatus.prototype.constructor = ExitStatus;
var initialStackTop;
var preloadStartTime = null;
var calledMain = false;
dependenciesFulfilled = function runCaller() {
 if (!Module["calledRun"]) run();
 if (!Module["calledRun"]) dependenciesFulfilled = runCaller;
};
Module["callMain"] = Module.callMain = function callMain(args) {
 args = args || [];
 ensureInitRuntime();
 var argc = args.length + 1;
 function pad() {
  for (var i = 0; i < 4 - 1; i++) {
   argv.push(0);
  }
 }
 var argv = [ allocate(intArrayFromString(Module["thisProgram"]), "i8", ALLOC_NORMAL) ];
 pad();
 for (var i = 0; i < argc - 1; i = i + 1) {
  argv.push(allocate(intArrayFromString(args[i]), "i8", ALLOC_NORMAL));
  pad();
 }
 argv.push(0);
 argv = allocate(argv, "i32", ALLOC_NORMAL);
 try {
  var ret = Module["_main"](argc, argv, 0);
  exit(ret, true);
 } catch (e) {
  if (e instanceof ExitStatus) {
   return;
  } else if (e == "SimulateInfiniteLoop") {
   Module["noExitRuntime"] = true;
   return;
  } else {
   if (e && typeof e === "object" && e.stack) Module.printErr("exception thrown: " + [ e, e.stack ]);
   throw e;
  }
 } finally {
  calledMain = true;
 }
};
function run(args) {
 args = args || Module["arguments"];
 if (preloadStartTime === null) preloadStartTime = Date.now();
 if (runDependencies > 0) {
  return;
 }
 preRun();
 if (runDependencies > 0) return;
 if (Module["calledRun"]) return;
 function doRun() {
  if (Module["calledRun"]) return;
  Module["calledRun"] = true;
  if (ABORT) return;
  ensureInitRuntime();
  preMain();
  if (Module["onRuntimeInitialized"]) Module["onRuntimeInitialized"]();
  if (Module["_main"] && shouldRunNow) Module["callMain"](args);
  postRun();
 }
 if (Module["setStatus"]) {
  Module["setStatus"]("Running...");
  setTimeout((function() {
   setTimeout((function() {
    Module["setStatus"]("");
   }), 1);
   doRun();
  }), 1);
 } else {
  doRun();
 }
}
Module["run"] = Module.run = run;
function exit(status, implicit) {
 if (implicit && Module["noExitRuntime"]) {
  return;
 }
 if (Module["noExitRuntime"]) {} else {
  ABORT = true;
  EXITSTATUS = status;
  STACKTOP = initialStackTop;
  exitRuntime();
  if (Module["onExit"]) Module["onExit"](status);
 }
 if (ENVIRONMENT_IS_NODE) {
  process["exit"](status);
 } else if (ENVIRONMENT_IS_SHELL && typeof quit === "function") {
  quit(status);
 }
 throw new ExitStatus(status);
}
Module["exit"] = Module.exit = exit;
var abortDecorators = [];
function abort(what) {
 if (what !== undefined) {
  Module.print(what);
  Module.printErr(what);
  what = JSON.stringify(what);
 } else {
  what = "";
 }
 ABORT = true;
 EXITSTATUS = 1;
 var extra = "\nIf this abort() is unexpected, build with -s ASSERTIONS=1 which can give more information.";
 var output = "abort(" + what + ") at " + stackTrace() + extra;
 if (abortDecorators) {
  abortDecorators.forEach((function(decorator) {
   output = decorator(output, what);
  }));
 }
 throw output;
}
Module["abort"] = Module.abort = abort;
if (Module["preInit"]) {
 if (typeof Module["preInit"] == "function") Module["preInit"] = [ Module["preInit"] ];
 while (Module["preInit"].length > 0) {
  Module["preInit"].pop()();
 }
}
var shouldRunNow = true;
if (Module["noInitialRun"]) {
 shouldRunNow = false;
}
run();




