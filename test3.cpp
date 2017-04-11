#include "test.h"
#include <cstdio>

int bar();
int foo();
int foo2();

int pp[5] = {5};
int* r = &pp[2];
int* q = &pp[4];
int main()
{
	try{
	*r = bar();
	*q = foo();
	*q += foo2();
	}
	catch(...)
	{
		*q = foo_header();
		printf("exce %d\n", pp[4]+pp[2]);
	}
	printf("%d\n", pp[4]+pp[2]);
	return 0;
}