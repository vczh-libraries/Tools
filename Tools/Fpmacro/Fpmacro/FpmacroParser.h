/***********************************************************************
Vczh Library++ 3.0
Developer: Zihan Chen(vczh)
Parser::FpmacroParser

本文件使用Vczh Parsing Generator工具自动生成
***********************************************************************/

#ifndef FPMACRO_PARSER
#define FPMACRO_PARSER

#include "..\..\..\Import\Vlpp.h"

namespace fpmacro
{
	namespace parser
	{
		enum class FpmParserTokenIndex
		{
			BRACKET_OPEN = 0,
			BRACKET_CLOSE = 1,
			ARRAY = 2,
			DEFINE = 3,
			BEGIN = 4,
			END = 5,
			COMMA = 6,
			NAME = 7,
			NEW_LINE = 8,
			SPACE = 9,
			TEXT_FRAGMENT = 10,
			BRACKET = 11,
		};
		class FpmExpression;
		class FpmConcatExpression;
		class FpmArrayExpression;
		class FpmInvokeExpression;
		class FpmBracketExpression;
		class FpmReferenceExpression;
		class FpmTextExpression;
		class FpmDefinition;
		class FpmExpressionDefinition;
		class FpmReferenceParameter;
		class FpmReferenceDefinition;
		class FpmMacro;

		class FpmExpression abstract : public vl::parsing::ParsingTreeCustomBase, vl::reflection::Description<FpmExpression>
		{
		public:
			class IVisitor : public vl::reflection::IDescriptable, vl::reflection::Description<IVisitor>
			{
			public:
				virtual void Visit(FpmConcatExpression* node)=0;
				virtual void Visit(FpmArrayExpression* node)=0;
				virtual void Visit(FpmInvokeExpression* node)=0;
				virtual void Visit(FpmBracketExpression* node)=0;
				virtual void Visit(FpmReferenceExpression* node)=0;
				virtual void Visit(FpmTextExpression* node)=0;
			};

			virtual void Accept(FpmExpression::IVisitor* visitor)=0;

		};

		class FpmConcatExpression : public FpmExpression, vl::reflection::Description<FpmConcatExpression>
		{
		public:
			vl::collections::List<vl::Ptr<FpmExpression>> expressions;

			void Accept(FpmExpression::IVisitor* visitor)override;

			static vl::Ptr<FpmConcatExpression> Convert(vl::Ptr<vl::parsing::ParsingTreeNode> node, const vl::collections::List<vl::regex::RegexToken>& tokens);
		};

		class FpmArrayExpression : public FpmExpression, vl::reflection::Description<FpmArrayExpression>
		{
		public:
			vl::collections::List<vl::Ptr<FpmExpression>> elements;

			void Accept(FpmExpression::IVisitor* visitor)override;

			static vl::Ptr<FpmArrayExpression> Convert(vl::Ptr<vl::parsing::ParsingTreeNode> node, const vl::collections::List<vl::regex::RegexToken>& tokens);
		};

		class FpmInvokeExpression : public FpmExpression, vl::reflection::Description<FpmInvokeExpression>
		{
		public:
			vl::Ptr<FpmExpression> function;
			vl::collections::List<vl::Ptr<FpmExpression>> arguments;

			void Accept(FpmExpression::IVisitor* visitor)override;

			static vl::Ptr<FpmInvokeExpression> Convert(vl::Ptr<vl::parsing::ParsingTreeNode> node, const vl::collections::List<vl::regex::RegexToken>& tokens);
		};

		class FpmBracketExpression : public FpmExpression, vl::reflection::Description<FpmBracketExpression>
		{
		public:
			vl::Ptr<FpmExpression> expression;

			void Accept(FpmExpression::IVisitor* visitor)override;

			static vl::Ptr<FpmBracketExpression> Convert(vl::Ptr<vl::parsing::ParsingTreeNode> node, const vl::collections::List<vl::regex::RegexToken>& tokens);
		};

		class FpmReferenceExpression : public FpmExpression, vl::reflection::Description<FpmReferenceExpression>
		{
		public:
			vl::parsing::ParsingToken name;

			void Accept(FpmExpression::IVisitor* visitor)override;

			static vl::Ptr<FpmReferenceExpression> Convert(vl::Ptr<vl::parsing::ParsingTreeNode> node, const vl::collections::List<vl::regex::RegexToken>& tokens);
		};

		class FpmTextExpression : public FpmExpression, vl::reflection::Description<FpmTextExpression>
		{
		public:
			vl::parsing::ParsingToken text;

			void Accept(FpmExpression::IVisitor* visitor)override;

			static vl::Ptr<FpmTextExpression> Convert(vl::Ptr<vl::parsing::ParsingTreeNode> node, const vl::collections::List<vl::regex::RegexToken>& tokens);
		};

		class FpmDefinition abstract : public vl::parsing::ParsingTreeCustomBase, vl::reflection::Description<FpmDefinition>
		{
		public:
			class IVisitor : public vl::reflection::IDescriptable, vl::reflection::Description<IVisitor>
			{
			public:
				virtual void Visit(FpmExpressionDefinition* node)=0;
				virtual void Visit(FpmReferenceDefinition* node)=0;
			};

			virtual void Accept(FpmDefinition::IVisitor* visitor)=0;

		};

		class FpmExpressionDefinition : public FpmDefinition, vl::reflection::Description<FpmExpressionDefinition>
		{
		public:
			vl::Ptr<FpmExpression> expression;

			void Accept(FpmDefinition::IVisitor* visitor)override;

			static vl::Ptr<FpmExpressionDefinition> Convert(vl::Ptr<vl::parsing::ParsingTreeNode> node, const vl::collections::List<vl::regex::RegexToken>& tokens);
		};

		class FpmReferenceParameter : public vl::parsing::ParsingTreeCustomBase, vl::reflection::Description<FpmReferenceParameter>
		{
		public:
			vl::parsing::ParsingToken name;

			static vl::Ptr<FpmReferenceParameter> Convert(vl::Ptr<vl::parsing::ParsingTreeNode> node, const vl::collections::List<vl::regex::RegexToken>& tokens);
		};

		class FpmReferenceDefinition : public FpmDefinition, vl::reflection::Description<FpmReferenceDefinition>
		{
		public:
			vl::parsing::ParsingToken name;
			vl::collections::List<vl::Ptr<FpmReferenceParameter>> parameters;
			vl::collections::List<vl::Ptr<FpmDefinition>> definitions;

			void Accept(FpmDefinition::IVisitor* visitor)override;

			static vl::Ptr<FpmReferenceDefinition> Convert(vl::Ptr<vl::parsing::ParsingTreeNode> node, const vl::collections::List<vl::regex::RegexToken>& tokens);
		};

		class FpmMacro : public vl::parsing::ParsingTreeCustomBase, vl::reflection::Description<FpmMacro>
		{
		public:
			vl::collections::List<vl::Ptr<FpmDefinition>> definitions;

			static vl::Ptr<FpmMacro> Convert(vl::Ptr<vl::parsing::ParsingTreeNode> node, const vl::collections::List<vl::regex::RegexToken>& tokens);
		};

		extern vl::WString FpmGetParserTextBuffer();
		extern vl::Ptr<vl::parsing::ParsingTreeCustomBase> FpmConvertParsingTreeNode(vl::Ptr<vl::parsing::ParsingTreeNode> node, const vl::collections::List<vl::regex::RegexToken>& tokens);
		extern vl::Ptr<vl::parsing::tabling::ParsingTable> FpmLoadTable();

		extern vl::Ptr<vl::parsing::ParsingTreeNode> FpmParseFpmacroCodeAsParsingTreeNode(const vl::WString& input, vl::Ptr<vl::parsing::tabling::ParsingTable> table, vl::collections::List<vl::Ptr<vl::parsing::ParsingError>>& errors);
		extern vl::Ptr<vl::parsing::ParsingTreeNode> FpmParseFpmacroCodeAsParsingTreeNode(const vl::WString& input, vl::Ptr<vl::parsing::tabling::ParsingTable> table);
		extern vl::Ptr<FpmMacro> FpmParseFpmacroCode(const vl::WString& input, vl::Ptr<vl::parsing::tabling::ParsingTable> table, vl::collections::List<vl::Ptr<vl::parsing::ParsingError>>& errors);
		extern vl::Ptr<FpmMacro> FpmParseFpmacroCode(const vl::WString& input, vl::Ptr<vl::parsing::tabling::ParsingTable> table);

		extern vl::Ptr<vl::parsing::ParsingTreeNode> FpmParseFpmacroCodeAsParsingTreeNode(const vl::WString& input, vl::Ptr<vl::parsing::tabling::ParsingTable> table, vl::collections::List<vl::Ptr<vl::parsing::ParsingError>>& errors);
		extern vl::Ptr<vl::parsing::ParsingTreeNode> FpmParseFpmacroCodeAsParsingTreeNode(const vl::WString& input, vl::Ptr<vl::parsing::tabling::ParsingTable> table);
		extern vl::Ptr<FpmMacro> FpmParseFpmacroCode(const vl::WString& input, vl::Ptr<vl::parsing::tabling::ParsingTable> table, vl::collections::List<vl::Ptr<vl::parsing::ParsingError>>& errors);
		extern vl::Ptr<FpmMacro> FpmParseFpmacroCode(const vl::WString& input, vl::Ptr<vl::parsing::tabling::ParsingTable> table);

	}
}
namespace vl
{
	namespace reflection
	{
		namespace description
		{
#ifndef VCZH_DEBUG_NO_REFLECTION
			DECL_TYPE_INFO(fpmacro::parser::FpmExpression)
			DECL_TYPE_INFO(fpmacro::parser::FpmConcatExpression)
			DECL_TYPE_INFO(fpmacro::parser::FpmArrayExpression)
			DECL_TYPE_INFO(fpmacro::parser::FpmInvokeExpression)
			DECL_TYPE_INFO(fpmacro::parser::FpmBracketExpression)
			DECL_TYPE_INFO(fpmacro::parser::FpmReferenceExpression)
			DECL_TYPE_INFO(fpmacro::parser::FpmTextExpression)
			DECL_TYPE_INFO(fpmacro::parser::FpmDefinition)
			DECL_TYPE_INFO(fpmacro::parser::FpmExpressionDefinition)
			DECL_TYPE_INFO(fpmacro::parser::FpmReferenceParameter)
			DECL_TYPE_INFO(fpmacro::parser::FpmReferenceDefinition)
			DECL_TYPE_INFO(fpmacro::parser::FpmMacro)
			DECL_TYPE_INFO(fpmacro::parser::FpmExpression::IVisitor)
			DECL_TYPE_INFO(fpmacro::parser::FpmDefinition::IVisitor)

			namespace interface_proxy
			{
				class FpmExpression_IVisitor : public ValueInterfaceRoot, public virtual fpmacro::parser::FpmExpression::IVisitor
				{
				public:
					FpmExpression_IVisitor(Ptr<IValueInterfaceProxy> proxy)
						:ValueInterfaceRoot(proxy)
					{
					}

					static Ptr<fpmacro::parser::FpmExpression::IVisitor> Create(Ptr<IValueInterfaceProxy> proxy)
					{
						return new FpmExpression_IVisitor(proxy);
					}

					void Visit(fpmacro::parser::FpmConcatExpression* node)override
					{
						INVOKE_INTERFACE_PROXY(Visit, node);
					}

					void Visit(fpmacro::parser::FpmArrayExpression* node)override
					{
						INVOKE_INTERFACE_PROXY(Visit, node);
					}

					void Visit(fpmacro::parser::FpmInvokeExpression* node)override
					{
						INVOKE_INTERFACE_PROXY(Visit, node);
					}

					void Visit(fpmacro::parser::FpmBracketExpression* node)override
					{
						INVOKE_INTERFACE_PROXY(Visit, node);
					}

					void Visit(fpmacro::parser::FpmReferenceExpression* node)override
					{
						INVOKE_INTERFACE_PROXY(Visit, node);
					}

					void Visit(fpmacro::parser::FpmTextExpression* node)override
					{
						INVOKE_INTERFACE_PROXY(Visit, node);
					}

				};

				class FpmDefinition_IVisitor : public ValueInterfaceRoot, public virtual fpmacro::parser::FpmDefinition::IVisitor
				{
				public:
					FpmDefinition_IVisitor(Ptr<IValueInterfaceProxy> proxy)
						:ValueInterfaceRoot(proxy)
					{
					}

					static Ptr<fpmacro::parser::FpmDefinition::IVisitor> Create(Ptr<IValueInterfaceProxy> proxy)
					{
						return new FpmDefinition_IVisitor(proxy);
					}

					void Visit(fpmacro::parser::FpmExpressionDefinition* node)override
					{
						INVOKE_INTERFACE_PROXY(Visit, node);
					}

					void Visit(fpmacro::parser::FpmReferenceDefinition* node)override
					{
						INVOKE_INTERFACE_PROXY(Visit, node);
					}

				};

				}
#endif

			extern bool FpmLoadTypes();
		}
	}
}
#endif