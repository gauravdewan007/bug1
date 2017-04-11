#include "test.h"

int ss = 56;
int* ssp = &ss;
int foo()
{
		int a = 5;
	try{
		if(*ssp != 56)
			throw 55;
		
		ss = foo_header();
	}
	catch(...)
	{
		a = 7;
	}
	return a;
}