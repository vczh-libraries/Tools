#include "FpmacroParser.h"

namespace fpmacro
{
	namespace parser
	{
/***********************************************************************
ParserText
***********************************************************************/

const wchar_t parserTextBuffer[] = 
L"\r\n"L""
L"\r\n"L"class Expression"
L"\r\n"L"{"
L"\r\n"L"}"
L"\r\n"L""
L"\r\n"L"class ConcatExpression : Expression"
L"\r\n"L"{"
L"\r\n"L"\tExpression[] expressions;"
L"\r\n"L"}"
L"\r\n"L""
L"\r\n"L"class ArrayExpression : Expression"
L"\r\n"L"{"
L"\r\n"L"\tExpression[] elements;"
L"\r\n"L"}"
L"\r\n"L""
L"\r\n"L"class InvokeExpression : Expression"
L"\r\n"L"{"
L"\r\n"L"\tExpression function;"
L"\r\n"L"\tExpression[] arguments;"
L"\r\n"L"}"
L"\r\n"L""
L"\r\n"L"class BracketExpression : Expression"
L"\r\n"L"{"
L"\r\n"L"\tExpression expression;"
L"\r\n"L"}"
L"\r\n"L""
L"\r\n"L"class ReferenceExpression : Expression"
L"\r\n"L"{"
L"\r\n"L"\ttoken name;"
L"\r\n"L"}"
L"\r\n"L""
L"\r\n"L"class TextExpression : Expression"
L"\r\n"L"{"
L"\r\n"L"\ttoken text;"
L"\r\n"L"}"
L"\r\n"L""
L"\r\n"L"class Definition"
L"\r\n"L"{"
L"\r\n"L"}"
L"\r\n"L""
L"\r\n"L"class ExpressionDefinition : Definition"
L"\r\n"L"{"
L"\r\n"L"\tExpression expression;"
L"\r\n"L"}"
L"\r\n"L""
L"\r\n"L"class ReferenceParameter"
L"\r\n"L"{"
L"\r\n"L"\ttoken name;"
L"\r\n"L"}"
L"\r\n"L""
L"\r\n"L"class ReferenceDefinition : Definition"
L"\r\n"L"{"
L"\r\n"L"\ttoken name;"
L"\r\n"L"\tReferenceParameter[] parameters;"
L"\r\n"L"\tDefinition[] definitions;"
L"\r\n"L"}"
L"\r\n"L""
L"\r\n"L"class Macro"
L"\r\n"L"{"
L"\r\n"L"\tDefinition[] definitions;"
L"\r\n"L"}"
L"\r\n"L""
L"\r\n"L"token BRACKET_OPEN = \"/(\";"
L"\r\n"L"token BRACKET_CLOSE = \"/)\";"
L"\r\n"L"token ARRAY = \"/$array\";"
L"\r\n"L"token DEFINE = \"/$/$define\";"
L"\r\n"L"token BEGIN = \"/$/$begin\";"
L"\r\n"L"token END = \"/$/$end\";"
L"\r\n"L"token COMMA = \",\";"
L"\r\n"L"token NAME = \"/$[a-zA-Z_]/w*\";"
L"\r\n"L"token NEW_LINE = \"[/r/n]+\";"
L"\r\n"L"token SPACE = \"[ /t]+\";"
L"\r\n"L""
L"\r\n"L"token TEXT_FRAGMENT = \"(////[^/r/n]*|///*([^*]|/*+[^*//])*/*+//)|\"\"([^\\\\\"\"]|\\\\\\.)*\"\"|[^/$(), /t/r/n\"\"]+|/$/(/./)|[//\"\"]\";"
L"\r\n"L"token BRACKET = \"/(/)\";"
L"\r\n"L""
L"\r\n"L"rule ReferenceExpression reference_exp"
L"\r\n"L"\t= NAME : name as ReferenceExpression"
L"\r\n"L"\t;"
L"\r\n"L"\t"
L"\r\n"L"rule Expression unit_exp_nc_nb"
L"\r\n"L"\t= \"$array\" \"(\" [exp_nc : elements {\",\" exp_nc : elements}] \")\" as ArrayExpression"
L"\r\n"L"\t= reference_exp : function \"(\" [exp_nc : arguments {\",\" exp_nc : arguments}] \")\" as InvokeExpression"
L"\r\n"L"\t= reference_exp : function \"()\" as InvokeExpression"
L"\r\n"L"\t= reference_exp : expressions unit_exp_nc_nb : expressions as ConcatExpression"
L"\r\n"L"\t= TEXT_FRAGMENT : text as TextExpression"
L"\r\n"L"\t= SPACE : text as TextExpression"
L"\r\n"L"\t;"
L"\r\n"L"\t"
L"\r\n"L"rule Expression unit_exp_nc"
L"\r\n"L"\t= !unit_exp_nc_nb"
L"\r\n"L"\t= BRACKET : text as TextExpression"
L"\r\n"L"\t= \"(\" exp : expression  \")\" as BracketExpression"
L"\r\n"L"\t;"
L"\r\n"L""
L"\r\n"L"rule Expression exp_nc"
L"\r\n"L"\t= !reference_exp"
L"\r\n"L"\t= unit_exp_nc : expressions {unit_exp_nc : expressions} [reference_exp : expressions] as ConcatExpression"
L"\r\n"L"\t;"
L"\r\n"L""
L"\r\n"L"rule Expression unit_exp_nb"
L"\r\n"L"\t= \"$array\" \"(\" [exp_nc : elements {\",\" exp_nc : elements}] \")\" as ArrayExpression"
L"\r\n"L"\t= reference_exp : function \"(\" [exp_nc : arguments {\",\" exp_nc : arguments}] \")\" as InvokeExpression"
L"\r\n"L"\t= reference_exp : function \"()\" as InvokeExpression"
L"\r\n"L"\t= reference_exp : expressions unit_exp_nb : expressions as ConcatExpression"
L"\r\n"L"\t= TEXT_FRAGMENT : text as TextExpression"
L"\r\n"L"\t= SPACE : text as TextExpression"
L"\r\n"L"\t= \",\" : text as TextExpression"
L"\r\n"L"\t;"
L"\r\n"L""
L"\r\n"L"rule Expression unit_exp"
L"\r\n"L"\t= !unit_exp_nb"
L"\r\n"L"\t= BRACKET : text as TextExpression"
L"\r\n"L"\t= \"(\" exp : expression  \")\" as BracketExpression"
L"\r\n"L"\t;"
L"\r\n"L""
L"\r\n"L"rule Expression exp"
L"\r\n"L"\t= !reference_exp"
L"\r\n"L"\t= unit_exp : expressions {unit_exp : expressions} [reference_exp : expressions] as ConcatExpression"
L"\r\n"L"\t;"
L"\r\n"L""
L"\r\n"L"rule ExpressionDefinition exp_def"
L"\r\n"L"\t= exp : expression as ExpressionDefinition"
L"\r\n"L"\t;"
L"\r\n"L""
L"\r\n"L"rule ReferenceParameter ref_parameter"
L"\r\n"L"\t= NAME : name as ReferenceParameter"
L"\r\n"L"\t;"
L"\r\n"L""
L"\r\n"L"rule ReferenceDefinition ref_def"
L"\r\n"L"\t= \"$$define\" [SPACE] NAME : name (\"(\" [ref_parameter : parameters {\",\" ref_parameter : parameters}] \")\" | \"()\") SPACE"
L"\r\n"L"\t\t( exp_def : definitions"
L"\r\n"L"\t\t| \"$$begin\" NEW_LINE {def : definitions NEW_LINE } \"$$end\""
L"\r\n"L"\t\t) as ReferenceDefinition"
L"\r\n"L"\t;"
L"\r\n"L""
L"\r\n"L"rule Definition def"
L"\r\n"L"\t= !exp_def"
L"\r\n"L"\t= !ref_def"
L"\r\n"L"\t;"
L"\r\n"L""
L"\r\n"L"rule Macro macro_start"
L"\r\n"L"\t= [NEW_LINE] def : definitions {NEW_LINE def : definitions} [NEW_LINE] as Macro"
L"\r\n"L"\t;"
;

		vl::WString FpmGetParserTextBuffer()
		{
			return parserTextBuffer;
		}

/***********************************************************************
Unescaping Function Foward Declarations
***********************************************************************/

/***********************************************************************
Parsing Tree Conversion Driver Implementation
***********************************************************************/

		class FpmTreeConverter : public vl::parsing::ParsingTreeConverter
		{
		public:
			using vl::parsing::ParsingTreeConverter::SetMember;

			void Fill(vl::Ptr<FpmExpression> tree, vl::Ptr<vl::parsing::ParsingTreeObject> obj, const TokenList& tokens)
			{
			}

			void Fill(vl::Ptr<FpmConcatExpression> tree, vl::Ptr<vl::parsing::ParsingTreeObject> obj, const TokenList& tokens)
			{
				SetMember(tree->expressions, obj->GetMember(L"expressions"), tokens);
			}

			void Fill(vl::Ptr<FpmArrayExpression> tree, vl::Ptr<vl::parsing::ParsingTreeObject> obj, const TokenList& tokens)
			{
				SetMember(tree->elements, obj->GetMember(L"elements"), tokens);
			}

			void Fill(vl::Ptr<FpmInvokeExpression> tree, vl::Ptr<vl::parsing::ParsingTreeObject> obj, const TokenList& tokens)
			{
				SetMember(tree->function, obj->GetMember(L"function"), tokens);
				SetMember(tree->arguments, obj->GetMember(L"arguments"), tokens);
			}

			void Fill(vl::Ptr<FpmBracketExpression> tree, vl::Ptr<vl::parsing::ParsingTreeObject> obj, const TokenList& tokens)
			{
				SetMember(tree->expression, obj->GetMember(L"expression"), tokens);
			}

			void Fill(vl::Ptr<FpmReferenceExpression> tree, vl::Ptr<vl::parsing::ParsingTreeObject> obj, const TokenList& tokens)
			{
				SetMember(tree->name, obj->GetMember(L"name"), tokens);
			}

			void Fill(vl::Ptr<FpmTextExpression> tree, vl::Ptr<vl::parsing::ParsingTreeObject> obj, const TokenList& tokens)
			{
				SetMember(tree->text, obj->GetMember(L"text"), tokens);
			}

			void Fill(vl::Ptr<FpmDefinition> tree, vl::Ptr<vl::parsing::ParsingTreeObject> obj, const TokenList& tokens)
			{
			}

			void Fill(vl::Ptr<FpmExpressionDefinition> tree, vl::Ptr<vl::parsing::ParsingTreeObject> obj, const TokenList& tokens)
			{
				SetMember(tree->expression, obj->GetMember(L"expression"), tokens);
			}

			void Fill(vl::Ptr<FpmReferenceParameter> tree, vl::Ptr<vl::parsing::ParsingTreeObject> obj, const TokenList& tokens)
			{
				SetMember(tree->name, obj->GetMember(L"name"), tokens);
			}

			void Fill(vl::Ptr<FpmReferenceDefinition> tree, vl::Ptr<vl::parsing::ParsingTreeObject> obj, const TokenList& tokens)
			{
				SetMember(tree->name, obj->GetMember(L"name"), tokens);
				SetMember(tree->parameters, obj->GetMember(L"parameters"), tokens);
				SetMember(tree->definitions, obj->GetMember(L"definitions"), tokens);
			}

			void Fill(vl::Ptr<FpmMacro> tree, vl::Ptr<vl::parsing::ParsingTreeObject> obj, const TokenList& tokens)
			{
				SetMember(tree->definitions, obj->GetMember(L"definitions"), tokens);
			}

			vl::Ptr<vl::parsing::ParsingTreeCustomBase> ConvertClass(vl::Ptr<vl::parsing::ParsingTreeObject> obj, const TokenList& tokens)override
			{
				if(obj->GetType()==L"ConcatExpression")
				{
					vl::Ptr<FpmConcatExpression> tree = new FpmConcatExpression;
					vl::collections::CopyFrom(tree->creatorRules, obj->GetCreatorRules());
					Fill(tree, obj, tokens);
					Fill(tree.Cast<FpmExpression>(), obj, tokens);
					return tree;
				}
				else if(obj->GetType()==L"ArrayExpression")
				{
					vl::Ptr<FpmArrayExpression> tree = new FpmArrayExpression;
					vl::collections::CopyFrom(tree->creatorRules, obj->GetCreatorRules());
					Fill(tree, obj, tokens);
					Fill(tree.Cast<FpmExpression>(), obj, tokens);
					return tree;
				}
				else if(obj->GetType()==L"InvokeExpression")
				{
					vl::Ptr<FpmInvokeExpression> tree = new FpmInvokeExpression;
					vl::collections::CopyFrom(tree->creatorRules, obj->GetCreatorRules());
					Fill(tree, obj, tokens);
					Fill(tree.Cast<FpmExpression>(), obj, tokens);
					return tree;
				}
				else if(obj->GetType()==L"BracketExpression")
				{
					vl::Ptr<FpmBracketExpression> tree = new FpmBracketExpression;
					vl::collections::CopyFrom(tree->creatorRules, obj->GetCreatorRules());
					Fill(tree, obj, tokens);
					Fill(tree.Cast<FpmExpression>(), obj, tokens);
					return tree;
				}
				else if(obj->GetType()==L"ReferenceExpression")
				{
					vl::Ptr<FpmReferenceExpression> tree = new FpmReferenceExpression;
					vl::collections::CopyFrom(tree->creatorRules, obj->GetCreatorRules());
					Fill(tree, obj, tokens);
					Fill(tree.Cast<FpmExpression>(), obj, tokens);
					return tree;
				}
				else if(obj->GetType()==L"TextExpression")
				{
					vl::Ptr<FpmTextExpression> tree = new FpmTextExpression;
					vl::collections::CopyFrom(tree->creatorRules, obj->GetCreatorRules());
					Fill(tree, obj, tokens);
					Fill(tree.Cast<FpmExpression>(), obj, tokens);
					return tree;
				}
				else if(obj->GetType()==L"ExpressionDefinition")
				{
					vl::Ptr<FpmExpressionDefinition> tree = new FpmExpressionDefinition;
					vl::collections::CopyFrom(tree->creatorRules, obj->GetCreatorRules());
					Fill(tree, obj, tokens);
					Fill(tree.Cast<FpmDefinition>(), obj, tokens);
					return tree;
				}
				else if(obj->GetType()==L"ReferenceParameter")
				{
					vl::Ptr<FpmReferenceParameter> tree = new FpmReferenceParameter;
					vl::collections::CopyFrom(tree->creatorRules, obj->GetCreatorRules());
					Fill(tree, obj, tokens);
					return tree;
				}
				else if(obj->GetType()==L"ReferenceDefinition")
				{
					vl::Ptr<FpmReferenceDefinition> tree = new FpmReferenceDefinition;
					vl::collections::CopyFrom(tree->creatorRules, obj->GetCreatorRules());
					Fill(tree, obj, tokens);
					Fill(tree.Cast<FpmDefinition>(), obj, tokens);
					return tree;
				}
				else if(obj->GetType()==L"Macro")
				{
					vl::Ptr<FpmMacro> tree = new FpmMacro;
					vl::collections::CopyFrom(tree->creatorRules, obj->GetCreatorRules());
					Fill(tree, obj, tokens);
					return tree;
				}
				else 
					return 0;
			}
		};

		vl::Ptr<vl::parsing::ParsingTreeCustomBase> FpmConvertParsingTreeNode(vl::Ptr<vl::parsing::ParsingTreeNode> node, const vl::collections::List<vl::regex::RegexToken>& tokens)
		{
			FpmTreeConverter converter;
			vl::Ptr<vl::parsing::ParsingTreeCustomBase> tree;
			converter.SetMember(tree, node, tokens);
			return tree;
		}

/***********************************************************************
Parsing Tree Conversion Implementation
***********************************************************************/

		vl::Ptr<FpmConcatExpression> FpmConcatExpression::Convert(vl::Ptr<vl::parsing::ParsingTreeNode> node, const vl::collections::List<vl::regex::RegexToken>& tokens)
		{
			return FpmConvertParsingTreeNode(node, tokens).Cast<FpmConcatExpression>();
		}

		vl::Ptr<FpmArrayExpression> FpmArrayExpression::Convert(vl::Ptr<vl::parsing::ParsingTreeNode> node, const vl::collections::List<vl::regex::RegexToken>& tokens)
		{
			return FpmConvertParsingTreeNode(node, tokens).Cast<FpmArrayExpression>();
		}

		vl::Ptr<FpmInvokeExpression> FpmInvokeExpression::Convert(vl::Ptr<vl::parsing::ParsingTreeNode> node, const vl::collections::List<vl::regex::RegexToken>& tokens)
		{
			return FpmConvertParsingTreeNode(node, tokens).Cast<FpmInvokeExpression>();
		}

		vl::Ptr<FpmBracketExpression> FpmBracketExpression::Convert(vl::Ptr<vl::parsing::ParsingTreeNode> node, const vl::collections::List<vl::regex::RegexToken>& tokens)
		{
			return FpmConvertParsingTreeNode(node, tokens).Cast<FpmBracketExpression>();
		}

		vl::Ptr<FpmReferenceExpression> FpmReferenceExpression::Convert(vl::Ptr<vl::parsing::ParsingTreeNode> node, const vl::collections::List<vl::regex::RegexToken>& tokens)
		{
			return FpmConvertParsingTreeNode(node, tokens).Cast<FpmReferenceExpression>();
		}

		vl::Ptr<FpmTextExpression> FpmTextExpression::Convert(vl::Ptr<vl::parsing::ParsingTreeNode> node, const vl::collections::List<vl::regex::RegexToken>& tokens)
		{
			return FpmConvertParsingTreeNode(node, tokens).Cast<FpmTextExpression>();
		}

		vl::Ptr<FpmExpressionDefinition> FpmExpressionDefinition::Convert(vl::Ptr<vl::parsing::ParsingTreeNode> node, const vl::collections::List<vl::regex::RegexToken>& tokens)
		{
			return FpmConvertParsingTreeNode(node, tokens).Cast<FpmExpressionDefinition>();
		}

		vl::Ptr<FpmReferenceParameter> FpmReferenceParameter::Convert(vl::Ptr<vl::parsing::ParsingTreeNode> node, const vl::collections::List<vl::regex::RegexToken>& tokens)
		{
			return FpmConvertParsingTreeNode(node, tokens).Cast<FpmReferenceParameter>();
		}

		vl::Ptr<FpmReferenceDefinition> FpmReferenceDefinition::Convert(vl::Ptr<vl::parsing::ParsingTreeNode> node, const vl::collections::List<vl::regex::RegexToken>& tokens)
		{
			return FpmConvertParsingTreeNode(node, tokens).Cast<FpmReferenceDefinition>();
		}

		vl::Ptr<FpmMacro> FpmMacro::Convert(vl::Ptr<vl::parsing::ParsingTreeNode> node, const vl::collections::List<vl::regex::RegexToken>& tokens)
		{
			return FpmConvertParsingTreeNode(node, tokens).Cast<FpmMacro>();
		}

/***********************************************************************
Visitor Pattern Implementation
***********************************************************************/

		void FpmConcatExpression::Accept(FpmExpression::IVisitor* visitor)
		{
			visitor->Visit(this);
		}

		void FpmArrayExpression::Accept(FpmExpression::IVisitor* visitor)
		{
			visitor->Visit(this);
		}

		void FpmInvokeExpression::Accept(FpmExpression::IVisitor* visitor)
		{
			visitor->Visit(this);
		}

		void FpmBracketExpression::Accept(FpmExpression::IVisitor* visitor)
		{
			visitor->Visit(this);
		}

		void FpmReferenceExpression::Accept(FpmExpression::IVisitor* visitor)
		{
			visitor->Visit(this);
		}

		void FpmTextExpression::Accept(FpmExpression::IVisitor* visitor)
		{
			visitor->Visit(this);
		}

		void FpmExpressionDefinition::Accept(FpmDefinition::IVisitor* visitor)
		{
			visitor->Visit(this);
		}

		void FpmReferenceDefinition::Accept(FpmDefinition::IVisitor* visitor)
		{
			visitor->Visit(this);
		}

/***********************************************************************
Parser Function
***********************************************************************/

		vl::Ptr<vl::parsing::ParsingTreeNode> FpmParseFpmacroCodeAsParsingTreeNode(const vl::WString& input, vl::Ptr<vl::parsing::tabling::ParsingTable> table, vl::collections::List<vl::Ptr<vl::parsing::ParsingError>>& errors)
		{
			vl::parsing::tabling::ParsingState state(input, table);
			state.Reset(L"macro_start");
			vl::Ptr<vl::parsing::tabling::ParsingGeneralParser> parser=vl::parsing::tabling::CreateStrictParser(table);
			vl::Ptr<vl::parsing::ParsingTreeNode> node=parser->Parse(state, errors);
			return node;
		}

		vl::Ptr<vl::parsing::ParsingTreeNode> FpmParseFpmacroCodeAsParsingTreeNode(const vl::WString& input, vl::Ptr<vl::parsing::tabling::ParsingTable> table)
		{
			vl::collections::List<vl::Ptr<vl::parsing::ParsingError>> errors;
			return FpmParseFpmacroCodeAsParsingTreeNode(input, table, errors);
		}

		vl::Ptr<FpmMacro> FpmParseFpmacroCode(const vl::WString& input, vl::Ptr<vl::parsing::tabling::ParsingTable> table, vl::collections::List<vl::Ptr<vl::parsing::ParsingError>>& errors)
		{
			vl::parsing::tabling::ParsingState state(input, table);
			state.Reset(L"macro_start");
			vl::Ptr<vl::parsing::tabling::ParsingGeneralParser> parser=vl::parsing::tabling::CreateStrictParser(table);
			vl::Ptr<vl::parsing::ParsingTreeNode> node=parser->Parse(state, errors);
			if(node && errors.Count()==0)
			{
				return FpmConvertParsingTreeNode(node, state.GetTokens()).Cast<FpmMacro>();
			}
			return 0;
		}

		vl::Ptr<FpmMacro> FpmParseFpmacroCode(const vl::WString& input, vl::Ptr<vl::parsing::tabling::ParsingTable> table)
		{
			vl::collections::List<vl::Ptr<vl::parsing::ParsingError>> errors;
			return FpmParseFpmacroCode(input, table, errors);
		}

/***********************************************************************
Table Generation
***********************************************************************/

		vl::Ptr<vl::parsing::tabling::ParsingTable> FpmLoadTable()
		{
		    vl::Ptr<vl::parsing::tabling::ParsingGeneralParser> parser=vl::parsing::tabling::CreateBootstrapStrictParser();
		    vl::collections::List<vl::Ptr<vl::parsing::ParsingError>> errors;
		    vl::Ptr<vl::parsing::ParsingTreeNode> definitionNode=parser->Parse(parserTextBuffer, L"ParserDecl", errors);
		    vl::Ptr<vl::parsing::definitions::ParsingDefinition> definition=vl::parsing::definitions::DeserializeDefinition(definitionNode);
		    vl::Ptr<vl::parsing::tabling::ParsingTable> table=vl::parsing::analyzing::GenerateTable(definition, true, errors);
		    return table;
		}

	}
}
namespace vl
{
	namespace reflection
	{
		namespace description
		{
#ifndef VCZH_DEBUG_NO_REFLECTION
			using namespace fpmacro::parser;

			IMPL_TYPE_INFO_RENAME(FpmExpression, Fpmacro::FpmExpression)
			IMPL_TYPE_INFO_RENAME(FpmConcatExpression, Fpmacro::FpmConcatExpression)
			IMPL_TYPE_INFO_RENAME(FpmArrayExpression, Fpmacro::FpmArrayExpression)
			IMPL_TYPE_INFO_RENAME(FpmInvokeExpression, Fpmacro::FpmInvokeExpression)
			IMPL_TYPE_INFO_RENAME(FpmBracketExpression, Fpmacro::FpmBracketExpression)
			IMPL_TYPE_INFO_RENAME(FpmReferenceExpression, Fpmacro::FpmReferenceExpression)
			IMPL_TYPE_INFO_RENAME(FpmTextExpression, Fpmacro::FpmTextExpression)
			IMPL_TYPE_INFO_RENAME(FpmDefinition, Fpmacro::FpmDefinition)
			IMPL_TYPE_INFO_RENAME(FpmExpressionDefinition, Fpmacro::FpmExpressionDefinition)
			IMPL_TYPE_INFO_RENAME(FpmReferenceParameter, Fpmacro::FpmReferenceParameter)
			IMPL_TYPE_INFO_RENAME(FpmReferenceDefinition, Fpmacro::FpmReferenceDefinition)
			IMPL_TYPE_INFO_RENAME(FpmMacro, Fpmacro::FpmMacro)
			IMPL_TYPE_INFO_RENAME(FpmExpression::IVisitor, Fpmacro::FpmExpression::IVisitor)
			IMPL_TYPE_INFO_RENAME(FpmDefinition::IVisitor, Fpmacro::FpmDefinition::IVisitor)

			BEGIN_CLASS_MEMBER(FpmExpression)
				CLASS_MEMBER_METHOD(Accept, {L"visitor"})

			END_CLASS_MEMBER(FpmExpression)

			BEGIN_CLASS_MEMBER(FpmConcatExpression)
				CLASS_MEMBER_BASE(FpmExpression)

				CLASS_MEMBER_CONSTRUCTOR(vl::Ptr<FpmConcatExpression>(), NO_PARAMETER)


				CLASS_MEMBER_FIELD(expressions)
			END_CLASS_MEMBER(FpmConcatExpression)

			BEGIN_CLASS_MEMBER(FpmArrayExpression)
				CLASS_MEMBER_BASE(FpmExpression)

				CLASS_MEMBER_CONSTRUCTOR(vl::Ptr<FpmArrayExpression>(), NO_PARAMETER)


				CLASS_MEMBER_FIELD(elements)
			END_CLASS_MEMBER(FpmArrayExpression)

			BEGIN_CLASS_MEMBER(FpmInvokeExpression)
				CLASS_MEMBER_BASE(FpmExpression)

				CLASS_MEMBER_CONSTRUCTOR(vl::Ptr<FpmInvokeExpression>(), NO_PARAMETER)


				CLASS_MEMBER_FIELD(function)
				CLASS_MEMBER_FIELD(arguments)
			END_CLASS_MEMBER(FpmInvokeExpression)

			BEGIN_CLASS_MEMBER(FpmBracketExpression)
				CLASS_MEMBER_BASE(FpmExpression)

				CLASS_MEMBER_CONSTRUCTOR(vl::Ptr<FpmBracketExpression>(), NO_PARAMETER)


				CLASS_MEMBER_FIELD(expression)
			END_CLASS_MEMBER(FpmBracketExpression)

			BEGIN_CLASS_MEMBER(FpmReferenceExpression)
				CLASS_MEMBER_BASE(FpmExpression)

				CLASS_MEMBER_CONSTRUCTOR(vl::Ptr<FpmReferenceExpression>(), NO_PARAMETER)

				CLASS_MEMBER_EXTERNALMETHOD(get_name, NO_PARAMETER, vl::WString(FpmReferenceExpression::*)(), [](FpmReferenceExpression* node){ return node->name.value; })
				CLASS_MEMBER_EXTERNALMETHOD(set_name, {L"value"}, void(FpmReferenceExpression::*)(const vl::WString&), [](FpmReferenceExpression* node, const vl::WString& value){ node->name.value = value; })

				CLASS_MEMBER_PROPERTY(name, get_name, set_name)
			END_CLASS_MEMBER(FpmReferenceExpression)

			BEGIN_CLASS_MEMBER(FpmTextExpression)
				CLASS_MEMBER_BASE(FpmExpression)

				CLASS_MEMBER_CONSTRUCTOR(vl::Ptr<FpmTextExpression>(), NO_PARAMETER)

				CLASS_MEMBER_EXTERNALMETHOD(get_text, NO_PARAMETER, vl::WString(FpmTextExpression::*)(), [](FpmTextExpression* node){ return node->text.value; })
				CLASS_MEMBER_EXTERNALMETHOD(set_text, {L"value"}, void(FpmTextExpression::*)(const vl::WString&), [](FpmTextExpression* node, const vl::WString& value){ node->text.value = value; })

				CLASS_MEMBER_PROPERTY(text, get_text, set_text)
			END_CLASS_MEMBER(FpmTextExpression)

			BEGIN_CLASS_MEMBER(FpmDefinition)
				CLASS_MEMBER_METHOD(Accept, {L"visitor"})

			END_CLASS_MEMBER(FpmDefinition)

			BEGIN_CLASS_MEMBER(FpmExpressionDefinition)
				CLASS_MEMBER_BASE(FpmDefinition)

				CLASS_MEMBER_CONSTRUCTOR(vl::Ptr<FpmExpressionDefinition>(), NO_PARAMETER)


				CLASS_MEMBER_FIELD(expression)
			END_CLASS_MEMBER(FpmExpressionDefinition)

			BEGIN_CLASS_MEMBER(FpmReferenceParameter)
				CLASS_MEMBER_CONSTRUCTOR(vl::Ptr<FpmReferenceParameter>(), NO_PARAMETER)

				CLASS_MEMBER_EXTERNALMETHOD(get_name, NO_PARAMETER, vl::WString(FpmReferenceParameter::*)(), [](FpmReferenceParameter* node){ return node->name.value; })
				CLASS_MEMBER_EXTERNALMETHOD(set_name, {L"value"}, void(FpmReferenceParameter::*)(const vl::WString&), [](FpmReferenceParameter* node, const vl::WString& value){ node->name.value = value; })

				CLASS_MEMBER_PROPERTY(name, get_name, set_name)
			END_CLASS_MEMBER(FpmReferenceParameter)

			BEGIN_CLASS_MEMBER(FpmReferenceDefinition)
				CLASS_MEMBER_BASE(FpmDefinition)

				CLASS_MEMBER_CONSTRUCTOR(vl::Ptr<FpmReferenceDefinition>(), NO_PARAMETER)

				CLASS_MEMBER_EXTERNALMETHOD(get_name, NO_PARAMETER, vl::WString(FpmReferenceDefinition::*)(), [](FpmReferenceDefinition* node){ return node->name.value; })
				CLASS_MEMBER_EXTERNALMETHOD(set_name, {L"value"}, void(FpmReferenceDefinition::*)(const vl::WString&), [](FpmReferenceDefinition* node, const vl::WString& value){ node->name.value = value; })

				CLASS_MEMBER_PROPERTY(name, get_name, set_name)
				CLASS_MEMBER_FIELD(parameters)
				CLASS_MEMBER_FIELD(definitions)
			END_CLASS_MEMBER(FpmReferenceDefinition)

			BEGIN_CLASS_MEMBER(FpmMacro)
				CLASS_MEMBER_CONSTRUCTOR(vl::Ptr<FpmMacro>(), NO_PARAMETER)


				CLASS_MEMBER_FIELD(definitions)
			END_CLASS_MEMBER(FpmMacro)

			BEGIN_CLASS_MEMBER(FpmExpression::IVisitor)
				CLASS_MEMBER_BASE(vl::reflection::IDescriptable)
				CLASS_MEMBER_EXTERNALCTOR(Ptr<FpmExpression::IVisitor>(Ptr<IValueInterfaceProxy>), {L"proxy"}, &interface_proxy::FpmExpression_IVisitor::Create)

				CLASS_MEMBER_METHOD_OVERLOAD(Visit, {L"node"}, void(FpmExpression::IVisitor::*)(FpmConcatExpression* node))
				CLASS_MEMBER_METHOD_OVERLOAD(Visit, {L"node"}, void(FpmExpression::IVisitor::*)(FpmArrayExpression* node))
				CLASS_MEMBER_METHOD_OVERLOAD(Visit, {L"node"}, void(FpmExpression::IVisitor::*)(FpmInvokeExpression* node))
				CLASS_MEMBER_METHOD_OVERLOAD(Visit, {L"node"}, void(FpmExpression::IVisitor::*)(FpmBracketExpression* node))
				CLASS_MEMBER_METHOD_OVERLOAD(Visit, {L"node"}, void(FpmExpression::IVisitor::*)(FpmReferenceExpression* node))
				CLASS_MEMBER_METHOD_OVERLOAD(Visit, {L"node"}, void(FpmExpression::IVisitor::*)(FpmTextExpression* node))
			END_CLASS_MEMBER(FpmExpression)

			BEGIN_CLASS_MEMBER(FpmDefinition::IVisitor)
				CLASS_MEMBER_BASE(vl::reflection::IDescriptable)
				CLASS_MEMBER_EXTERNALCTOR(Ptr<FpmDefinition::IVisitor>(Ptr<IValueInterfaceProxy>), {L"proxy"}, &interface_proxy::FpmDefinition_IVisitor::Create)

				CLASS_MEMBER_METHOD_OVERLOAD(Visit, {L"node"}, void(FpmDefinition::IVisitor::*)(FpmExpressionDefinition* node))
				CLASS_MEMBER_METHOD_OVERLOAD(Visit, {L"node"}, void(FpmDefinition::IVisitor::*)(FpmReferenceDefinition* node))
			END_CLASS_MEMBER(FpmDefinition)

			class FpmTypeLoader : public vl::Object, public ITypeLoader
			{
			public:
				void Load(ITypeManager* manager)
				{
					ADD_TYPE_INFO(fpmacro::parser::FpmExpression)
					ADD_TYPE_INFO(fpmacro::parser::FpmConcatExpression)
					ADD_TYPE_INFO(fpmacro::parser::FpmArrayExpression)
					ADD_TYPE_INFO(fpmacro::parser::FpmInvokeExpression)
					ADD_TYPE_INFO(fpmacro::parser::FpmBracketExpression)
					ADD_TYPE_INFO(fpmacro::parser::FpmReferenceExpression)
					ADD_TYPE_INFO(fpmacro::parser::FpmTextExpression)
					ADD_TYPE_INFO(fpmacro::parser::FpmDefinition)
					ADD_TYPE_INFO(fpmacro::parser::FpmExpressionDefinition)
					ADD_TYPE_INFO(fpmacro::parser::FpmReferenceParameter)
					ADD_TYPE_INFO(fpmacro::parser::FpmReferenceDefinition)
					ADD_TYPE_INFO(fpmacro::parser::FpmMacro)
					ADD_TYPE_INFO(fpmacro::parser::FpmExpression::IVisitor)
					ADD_TYPE_INFO(fpmacro::parser::FpmDefinition::IVisitor)
				}

				void Unload(ITypeManager* manager)
				{
				}
			};
#endif

			bool FpmLoadTypes()
			{
#ifndef VCZH_DEBUG_NO_REFLECTION
				ITypeManager* manager=GetGlobalTypeManager();
				if(manager)
				{
					Ptr<ITypeLoader> loader=new FpmTypeLoader;
					return manager->AddTypeLoader(loader);
				}
#endif
				return false;
			}
		}
	}
}
