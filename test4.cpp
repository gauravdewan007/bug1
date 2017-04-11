#include "test.h"

int ss2 = 56;
int* ssp2 = &ss2;
int foo2()
{
		int a = 5;
	try{
		if(*ssp2 != 56)
			throw 55;
		
		ss2 = foo_header();
	}
	catch(...)
	{
		a = 7;
	}
	return a;
}