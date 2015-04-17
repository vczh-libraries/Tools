#include "FpmacroRuntime.h"
#include "FpmacroParser.h"

using namespace vl;
using namespace vl::console;
using namespace vl::stream;
using namespace vl::collections;
using namespace vl::parsing;
using namespace vl::parsing::tabling;
using namespace fpmacro;
using namespace fpmacro::parser;

/***********************************************************************
ExpressionCreateObjectVisitor
***********************************************************************/

class ExpressionCreateObjectVisitor : public Object, public FpmExpression::IVisitor
{
public:
	RunningObject::Ref			runningObject;

	static RunningObject::Ref Do(Ptr<FpmExpression> node)
	{
		ExpressionCreateObjectVisitor visitor;
		node->Accept(&visitor);
		return visitor.runningObject;
	}

	void Visit(FpmConcatExpression* node)
	{
		ConcatObject* result=new ConcatObject;
		FOREACH(Ptr<FpmExpression>, expression, node->expressions)
		{
			result->objects.Add(Do(expression));
		}
		runningObject=result;
	}

	void Visit(FpmArrayExpression* node)
	{
		ArrayObject* result=new ArrayObject;
		FOREACH(Ptr<FpmExpression>, expression, node->elements)
		{
			result->objects.Add(Do(expression));
		}
		runningObject=result;
	}

	void Visit(FpmInvokeExpression* node)
	{
		InvokeObject* result=new InvokeObject;
		result->target=Do(node->function);
		FOREACH(Ptr<FpmExpression>, expression, node->arguments)
		{
			result->arguments.Add(Do(expression));
		}
		runningObject=result;
	}

	void Visit(FpmBracketExpression* node)
	{
		ConcatObject* result=new ConcatObject;
		{
			TextObject* bracket=new TextObject;
			bracket->text=L"(";
			result->objects.Add(bracket);
		}
		result->objects.Add(Do(node->expression));
		{
			TextObject* bracket=new TextObject;
			bracket->text=L")";
			result->objects.Add(bracket);
		}
		runningObject=result;
	}

	void Visit(FpmReferenceExpression* node)
	{
		PredefinedObject::Type type=PredefinedObject::Unknown;
		bool found=true;
		if(node->name.value==L"$add")type=PredefinedObject::Add;
		else if(node->name.value==L"$sub")type=PredefinedObject::Sub;
		else if(node->name.value==L"$mul")type=PredefinedObject::Mul;
		else if(node->name.value==L"$div")type=PredefinedObject::Div;
		else if(node->name.value==L"$mod")type=PredefinedObject::Mod;
		else if(node->name.value==L"$lt")type=PredefinedObject::LT;
		else if(node->name.value==L"$le")type=PredefinedObject::LE;
		else if(node->name.value==L"$gt")type=PredefinedObject::GT;
		else if(node->name.value==L"$ge")type=PredefinedObject::GE;
		else if(node->name.value==L"$eq")type=PredefinedObject::EQ;
		else if(node->name.value==L"$ne")type=PredefinedObject::NE;
		else if(node->name.value==L"$if")type=PredefinedObject::If;
		else if(node->name.value==L"$loop")type=PredefinedObject::Loop;
		else if(node->name.value==L"$loopsep")type=PredefinedObject::LoopSep;
		else if(node->name.value==L"$head")type=PredefinedObject::Head;
		else if(node->name.value==L"$tail")type=PredefinedObject::Tail;
		else if(node->name.value==L"$length")type=PredefinedObject::Length;
		else if(node->name.value==L"$get")type=PredefinedObject::Get;
		else found=false;
		if(found)
		{
			PredefinedObject* result=new PredefinedObject;
			result->type=type;
			runningObject=result;
		}
		else
		{
			ReferenceObject* result=new ReferenceObject;
			result->name=node->name.value;
			runningObject=result;
		}
	}

	void Visit(FpmTextExpression* node)
	{
		TextObject* result=new TextObject;
		if(node->text.value.Length()==4 && node->text.value.Sub(0, 2)==L"$(")
		{
			result->text=node->text.value[2];
		}
		else
		{
			result->text=node->text.value;
		}
		runningObject=result;
	}
};

/***********************************************************************
DefinitionCreateObjectVisitor
***********************************************************************/

class DefinitionCreateObjectVisitor : public Object, public FpmDefinition::IVisitor
{
public:
	RunningObject::Environment::Ref		environment;
	RunningObject::Ref					runningObject;

	DefinitionCreateObjectVisitor(RunningObject::Environment::Ref _environment)
		:environment(_environment)
	{
	}

	static RunningObject::Ref Do(Ptr<FpmDefinition> node, RunningObject::Environment::Ref environment)
	{
		DefinitionCreateObjectVisitor visitor(environment);
		node->Accept(&visitor);
		return visitor.runningObject;
	}

	void Visit(FpmExpressionDefinition* node)
	{
		runningObject=ExpressionCreateObjectVisitor::Do(node->expression);
	}

	void Visit(FpmReferenceDefinition* node)
	{
		ExecutableObject* result=new ExecutableObject;
		result->name=node->name.value;
		result->predefinedEnvironment=new RunningObject::Environment;
		FOREACH(Ptr<FpmReferenceParameter>, parameter, node->parameters)
		{
			result->parameters.Add(parameter->name.value);
		}
		ConcatObject* concat=new ConcatObject;
		FOREACH(Ptr<FpmDefinition>, definition, node->definitions)
		{
			RunningObject::Ref item=Do(definition, result->predefinedEnvironment);
			if(item)
			{
				if(concat->objects.Count())
				{
					TextObject* newLine=new TextObject;
					newLine->text=L"\r\n";
					concat->objects.Add(newLine);
				}
				concat->objects.Add(item);
			}
		}
		result->runningObject=concat;
		environment->objects.Add(node->name.value, result);
	}
};

/***********************************************************************
ExpressionToStringVisitor
***********************************************************************/

class ExpressionToStringVisitor : public Object, public FpmExpression::IVisitor
{
public:
	WString						prefix;
	TextWriter&					writer;

	ExpressionToStringVisitor(const WString& _prefix, TextWriter& _writer)
		:prefix(_prefix)
		,writer(_writer)
	{
	}

	static void Do(Ptr<FpmExpression> node, WString prefix, TextWriter& writer)
	{
		ExpressionToStringVisitor visitor(prefix, writer);
		node->Accept(&visitor);
	}

	void Visit(FpmConcatExpression* node)
	{
		writer.WriteString(prefix);
		writer.WriteLine(L"CONCAT {");
		FOREACH(Ptr<FpmExpression>, expression, node->expressions)
		{
			Do(expression, prefix+L"    ", writer);
		}
		writer.WriteString(prefix);
		writer.WriteLine(L"}");
	}

	void Visit(FpmArrayExpression* node)
	{
		writer.WriteString(prefix);
		writer.WriteLine(L"ARRAY {");
		FOREACH(Ptr<FpmExpression>, expression, node->elements)
		{
			Do(expression, prefix+L"    ", writer);
		}
		writer.WriteString(prefix);
		writer.WriteLine(L"}");
	}

	void Visit(FpmInvokeExpression* node)
	{
		writer.WriteString(prefix);
		writer.WriteLine(L"INVOKE {");
		Do(node->function, prefix+L"    ", writer);

		writer.WriteString(prefix+L"    ");
		writer.WriteLine(L"ARGUMENTS {");
		FOREACH(Ptr<FpmExpression>, expression, node->arguments)
		{
			Do(expression, prefix+L"        ", writer);
		}
		writer.WriteString(prefix+L"    ");
		writer.WriteLine(L"}");

		writer.WriteString(prefix);
		writer.WriteLine(L"}");
	}

	void Visit(FpmBracketExpression* node)
	{
		writer.WriteString(prefix);
		writer.WriteLine(L"CONCAT {");

		writer.WriteLine(prefix);
		writer.WriteLine(L"    TEXT: (");
		Do(node->expression, prefix+L"    ", writer);
		writer.WriteLine(prefix);
		writer.WriteLine(L"    TEXT: )");

		writer.WriteString(prefix);
		writer.WriteLine(L"}");
	}

	void Visit(FpmReferenceExpression* node)
	{
		writer.WriteString(prefix);
		writer.WriteString(L"NAME : ");
		writer.WriteLine(node->name.value);
	}

	void Visit(FpmTextExpression* node)
	{
		writer.WriteString(prefix);
		writer.WriteString(L"TEXT : ");
		if(node->text.value.Length()==4 && node->text.value.Sub(0, 2)==L"$(")
		{
			writer.WriteLine(node->text.value[2]);
		}
		else
		{
			writer.WriteLine(node->text.value);
		}
	}
};

/***********************************************************************
DefinitionToStringVisitor
***********************************************************************/

class DefinitionToStringVisitor : public Object, public FpmDefinition::IVisitor
{
public:
	WString						prefix;
	TextWriter&					writer;

	DefinitionToStringVisitor(const WString& _prefix, TextWriter& _writer)
		:prefix(_prefix)
		,writer(_writer)
	{
	}

	static void Do(Ptr<FpmDefinition> node, WString prefix, TextWriter& writer)
	{
		DefinitionToStringVisitor visitor(prefix, writer);
		node->Accept(&visitor);
	}

	void Visit(FpmExpressionDefinition* node)
	{
		ExpressionToStringVisitor::Do(node->expression, prefix, writer);
	}

	void Visit(FpmReferenceDefinition* node)
	{
		writer.WriteString(prefix);
		writer.WriteLine(L"REFERENCE {");
		writer.WriteString(prefix);
		writer.WriteString(L"    ");
		writer.WriteString(node->name.value);
		writer.WriteString(L" : ");
		FOREACH_INDEXER(Ptr<FpmReferenceParameter>, parameter, i, node->parameters)
		{
			if(i)writer.WriteString(L" , ");
			writer.WriteString(parameter->name.value);
		}
		writer.WriteLine(L"");
		FOREACH(Ptr<FpmDefinition>, definition, node->definitions)
		{
			Do(definition, prefix+L"    ", writer);
		}
		writer.WriteString(prefix);
		writer.WriteLine(L"}");
	}
};

/***********************************************************************
Macro Functions
***********************************************************************/

void MacroToString(Ptr<FpmMacro> macro, const WString& prefix, TextWriter& writer)
{
	writer.WriteString(prefix);
	writer.WriteLine(L"MACRO {");;
	FOREACH(Ptr<FpmDefinition>, definition, macro->definitions)
	{
		DefinitionToStringVisitor::Do(definition, prefix+L"    ", writer);
	}
	writer.WriteString(prefix);
	writer.WriteLine(L"}");
}

RunningObject::Ref MacroCreateObject(Ptr<FpmMacro> macro)
{
	ExecutableObject* result=new ExecutableObject;
	result->predefinedEnvironment=new RunningObject::Environment;
	ConcatObject* concat=new ConcatObject;
	FOREACH(Ptr<FpmDefinition>, definition, macro->definitions)
	{
		RunningObject::Ref item=DefinitionCreateObjectVisitor::Do(definition, result->predefinedEnvironment);
		if(item)
		{
			if(concat->objects.Count())
			{
				TextObject* newLine=new TextObject;
				newLine->text=L"\r\n";
				concat->objects.Add(newLine);
			}
			concat->objects.Add(item);
		}
	}
	result->runningObject=concat;
	return result;
}

/***********************************************************************
Interpretor
***********************************************************************/

void RunMacro(const WString& input, TextWriter& output, TextWriter& log, Ptr<ParsingTable> table)
{
	List<vl::Ptr<vl::parsing::ParsingError>> errors;
	Ptr<FpmMacro> macro;
	{
		ParsingState state(input, table);
		state.Reset(L"macro_start");
		Ptr<ParsingGeneralParser> parser=new ParsingAmbiguousParser;
		Ptr<ParsingTreeNode> node=parser->Parse(state, errors);
		if(node)
		{
			macro=FpmConvertParsingTreeNode(node, state.GetTokens()).Cast<FpmMacro>();
		}
	}

	if(errors.Count()==0)
	{
		log.WriteLine(L"==============================================================================================");
		log.WriteLine(L"Syntax Tree");
		log.WriteLine(L"==============================================================================================");
		MacroToString(macro, L"", log);
		log.WriteLine(L"==============================================================================================");
		log.WriteLine(L"Running Result");
		log.WriteLine(L"==============================================================================================");

		RunningObject::Ref object=MacroCreateObject(macro);
		RunningObject::Environment::Ref environment=new RunningObject::Environment;
		List<RunningObject::Ref> arguments;
		try
		{
			object=RunningObject::Invoke(object, environment, arguments);
			TextObject* textObject=dynamic_cast<TextObject*>(object.Obj());
			if(textObject)
			{
				output.WriteString(textObject->text);
			}
			else
			{
				log.WriteLine(L"运行结果不是一个字符串。");
			}
		}
		catch(const Exception& e)
		{
			log.WriteLine(e.Message());
		}
	}
	else
	{
		log.WriteLine(L"==============================================================================================");
		log.WriteLine(L"Errors");
		log.WriteLine(L"==============================================================================================");
		FOREACH(Ptr<ParsingError>, error, errors)
		{
			log.WriteLine(L"row="+itow(error->codeRange.start.row+1)+L", col="+itow(error->codeRange.start.column+1)+L": "+error->errorMessage);
		}
	}
}

/***********************************************************************
Main function
***********************************************************************/

WString GetDirectory(const WString& fileName)
{
	int index=0;
	for(int i=0;i<fileName.Length();i++)
	{
		if(fileName[i]==L'\\')
		{
			index=i;
		}
	}
	return fileName.Left(index+1);
}

WString DereferenceMacroFile(const WString& inputPath)
{
	WString result;
	WString directory=GetDirectory(inputPath);

	FileStream inputFileStream(inputPath, FileStream::ReadOnly);
	BomDecoder inputDecoder;
	DecoderStream inputStream(inputFileStream, inputDecoder);
	StreamReader inputReader(inputStream);

	while(!inputReader.IsEnd())
	{
		WString line=inputReader.ReadLine();
		if(line.Length()>=10 && line.Left(10)==L"$$include:")
		{
			result+=DereferenceMacroFile(directory+line.Right(line.Length()-10));
		}
		else
		{
			result+=line+L"\r\n";
		}
	}
	return result;
}

extern WString GetBaseDirectory();

int wmain(int argc, wchar_t* argv[])
{
	WString baseDirectory=GetBaseDirectory();

	Console::SetTitle(L"Vczh Functional Macro for C++ Code Generation");
	Console::SetColor(false, true, false, true);
	Console::WriteLine(L"fpm>Files : "+itow(argc-1));
	Ptr<ParsingTable> table=FpmLoadTable();
	for(int i=1;i<argc;i++)
	{
		Console::WriteLine(L"------------------------------------------------------------");
		WString inputPath=argv[i];
		if(inputPath.Length()<2 || inputPath[1]!=L':')
		{
			inputPath=baseDirectory+inputPath;
		}
		Console::WriteLine(L"fpm>Making : "+inputPath);
		if(inputPath.Length()<4 || inputPath.Right(4)!=L".fpm")
		{
			Console::SetColor(true, false, false, true);
			Console::WriteLine(L"error> The extenion name of the input file path must be \".fpm\".");
			Console::SetColor(false, true, false, true);
		}
		else
		{
			WString outputPath=inputPath.Left(inputPath.Length()-4);
			Console::WriteLine(L"fpm>Output path : "+outputPath);
			WString logPath=outputPath+L".log";
			Console::WriteLine(L"fpm>Log path : "+logPath);

			FileStream outputFileStream(outputPath, FileStream::WriteOnly);
			if(!outputFileStream.IsAvailable())
			{
				Console::SetColor(true, false, false, true);
				Console::WriteLine(L"error> \""+outputPath+L"\" can not be opened for writing.");
				Console::SetColor(false, true, false, true);
				continue;
			}
			BomEncoder outputEncoder(BomEncoder::Mbcs);
			EncoderStream outputStream(outputFileStream, outputEncoder);
			StreamWriter outputWriter(outputStream);

			FileStream logFileStream(logPath, FileStream::WriteOnly);
			BomEncoder logEncoder(BomEncoder::Mbcs);
			EncoderStream logStream(logFileStream, logEncoder);
			StreamWriter logWriter(logStream);

			WString dereference=DereferenceMacroFile(inputPath);
			logWriter.WriteLine(L"==============================================================================================");
			logWriter.WriteLine(L"Dereferenced");
			logWriter.WriteLine(L"==============================================================================================");
			logWriter.WriteLine(dereference);
			RunMacro(dereference, outputWriter, logWriter, table);
		}
	}
	Console::WriteLine(L"Finished!");
	return 0;
}