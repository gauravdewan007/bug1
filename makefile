all:
	em++ test1.cpp test2.cpp test3.cpp test4.cpp -Oz -s DISABLE_EXCEPTION_CATCHING=1 -s EVAL_CTORS=0 --profiling -o test.js