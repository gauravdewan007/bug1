 //from \boost_libraries\boost\system\detail\error_code.ipp
 
 #define BOOST_SYSTEM_NOEXCEPT
 
 class error_category //: public noncopyable
    {
    public:
      virtual ~error_category(){}
	  };

	 const error_category &  system_category() BOOST_SYSTEM_NOEXCEPT;
     const error_category &  generic_category() BOOST_SYSTEM_NOEXCEPT;
	
	extern int* ssp;
	inline int foo_header()
	{
		int a = 5;
	try{
		if(*ssp != 56)
			throw 55;
	}
	catch(...)
	{
		a = 7;
	}
	return a;
	}
# ifndef BOOST_SYSTEM_NO_DEPRECATED
    inline const error_category &  get_system_category() { return system_category(); }
    inline const error_category &  get_generic_category() { return generic_category(); }
    inline const error_category &  get_posix_category() { return generic_category(); }
    static const error_category &  posix_category = generic_category();
    static const error_category &  errno_ecat     = generic_category();
    static const error_category &  native_ecat    = system_category();
# endif