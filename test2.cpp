#include "test.h"

int* z;
extern int* ssp;
int fooss();

int bar()
{
	int pp = 3;
	try{
		if(*ssp != 56)
			throw 55;
		
		z = &pp;
		*ssp = fooss();
	}
	catch(...)
	{
		pp = 9;
	}
	return pp;
}

int fooss()
{
		int a = 5;
	try{
		if(*ssp != 56)
			throw 55;
		extern int ss;
		ss = foo_header();
	}
	catch(...)
	{
		a = 7;
	}
	return a;
}

error_category gen;
error_category sys;

 const error_category &  system_category() BOOST_SYSTEM_NOEXCEPT
{
	return sys;
}
     const error_category &  generic_category() BOOST_SYSTEM_NOEXCEPT
	{
		return gen;
	}