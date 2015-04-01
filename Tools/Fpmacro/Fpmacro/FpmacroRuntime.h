#ifndef FPMACRO_RUNTIME
#define FPMACRO_RUNTIME

#include "..\..\..\Import\Vlpp.h"

using namespace vl;
using namespace vl::collections;
using namespace vl::stream;

namespace fpmacro
{
	class RunningObject : public Object
	{
	public:
		typedef Ptr<RunningObject>			Ref;

		class Environment : public Object
		{
		public:
			typedef Ptr<Environment>							Ref;
			typedef Dictionary<WString, RunningObject::Ref>		ObjectMap;

			Ref								previous;
			ObjectMap						objects;
		};

	protected:
		virtual RunningObject::Ref			RunInternal(RunningObject::Ref self, Environment::Ref environment)=0;
		virtual RunningObject::Ref			InvokeInternal(RunningObject::Ref self, Environment::Ref environment, const List<RunningObject::Ref>& arguments)=0;

	public:

		static RunningObject::Ref			Run(RunningObject::Ref object, Environment::Ref environment);
		static RunningObject::Ref			Invoke(RunningObject::Ref object, Environment::Ref environment, const List<RunningObject::Ref>& arguments);
	};

	class ReferenceObject : public RunningObject
	{
	public:
		WString								name;

	protected:
		RunningObject::Ref					RunInternal(RunningObject::Ref self, Environment::Ref environment)override;
		RunningObject::Ref					InvokeInternal(RunningObject::Ref self, Environment::Ref environment, const List<RunningObject::Ref>& arguments)override;
	};

	class ExecutableObject : public RunningObject
	{
	public:
		List<WString>						parameters;
		RunningObject::Ref					runningObject;
		Environment::Ref					predefinedEnvironment;
		WString								name;

	protected:
		RunningObject::Ref					RunInternal(RunningObject::Ref self, Environment::Ref environment)override;
		RunningObject::Ref					InvokeInternal(RunningObject::Ref self, Environment::Ref environment, const List<RunningObject::Ref>& arguments)override;
	};

	class TextObject : public RunningObject
	{
	public:
		WString								text;

	protected:
		RunningObject::Ref					RunInternal(RunningObject::Ref self, Environment::Ref environment)override;
		RunningObject::Ref					InvokeInternal(RunningObject::Ref self, Environment::Ref environment, const List<RunningObject::Ref>& arguments)override;
	};

	class ConcatObject : public RunningObject
	{
	public:
		List<RunningObject::Ref>			objects;

	protected:
		RunningObject::Ref					RunInternal(RunningObject::Ref self, Environment::Ref environment)override;
		RunningObject::Ref					InvokeInternal(RunningObject::Ref self, Environment::Ref environment, const List<RunningObject::Ref>& arguments)override;
	};

	class ArrayObject : public RunningObject
	{
	public:
		List<RunningObject::Ref>			objects;

	protected:
		RunningObject::Ref					RunInternal(RunningObject::Ref self, Environment::Ref environment)override;
		RunningObject::Ref					InvokeInternal(RunningObject::Ref self, Environment::Ref environment, const List<RunningObject::Ref>& arguments)override;
	};

	class InvokeObject : public RunningObject
	{
	public:
		RunningObject::Ref					target;
		List<RunningObject::Ref>			arguments;

	protected:
		RunningObject::Ref					RunInternal(RunningObject::Ref self, Environment::Ref environment)override;
		RunningObject::Ref					InvokeInternal(RunningObject::Ref self, Environment::Ref environment, const List<RunningObject::Ref>& arguments)override;
	};

	class PredefinedObject : public RunningObject
	{
	public:
		enum Type
		{
			Add,
			Sub,
			Mul,
			Div,
			Mod,
			LE,
			LT,
			GE,
			GT,
			EQ,
			NE,
			If,
			Loop,
			LoopSep,
			Head,
			Tail,
			Length,
			Get,
			Unknown
		};

		Type								type;

	protected:
		int									GetInt(RunningObject::Ref object, Environment::Ref environment);
		WString								GetStr(RunningObject::Ref object, Environment::Ref environment);
		RunningObject::Ref					GetObj(int number);
		RunningObject::Ref					GetObj(WString text);
		RunningObject::Ref					RunInternal(RunningObject::Ref self, Environment::Ref environment)override;
		RunningObject::Ref					InvokeInternal(RunningObject::Ref self, Environment::Ref environment, const List<RunningObject::Ref>& arguments)override;
	};
}

#endif