using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace GenXmlDocRef
{
    enum CppDecoration
    {
        None,
        Decoration,
        Template,
        Function,
    }

    class CppType
    {
        public string Name { get; set; }
        public CppDecoration Decoration { get; set; }
        public string CallingConversion { get; set; }
        public CppType[] Arguments { get; set; }

        public CppType()
        {
            this.Name = "";
            this.Decoration = CppDecoration.None;
            this.CallingConversion = "";
            this.Arguments = new CppType[0];
        }

        private static bool ParseToken(string[] input, ref int index)
        {
            return index < input.Length;
        }

        private static bool ParseString(string[] input, ref int index, params string[] acceptables)
        {
            if (ParseToken(input, ref index))
            {
                string token = input[index];
                if (acceptables.Any(s => s == token))
                {
                    index++;
                    return true;
                }
            }
            return false;
        }

        private static bool ParseSignedUnsigned(string[] input, ref int index)
        {
            return ParseString(input, ref index, "unsigned", "signed");
        }

        private static bool ParseInt(string[] input, ref int index)
        {
            return ParseString(input, ref index, "__int8", "__int16", "__int32", "__int64", "__int128");
        }

        private static bool ParseVCRP(string[] input, ref int index)
        {
            return ParseString(input, ref index, "const", "volatile", "*", "&");
        }

        private static bool ParseName(string[] input, ref int index)
        {
            if (
                ParseString(input, ref index, "<", ">", ",", "(", ")") ||
                ParseSignedUnsigned(input, ref index) ||
                ParseInt(input, ref index) ||
                ParseVCRP(input, ref index))
            {
                index--;
                return false;
            }

            ParseString(input, ref index, "enum");
            index++;
            return true;
        }

        private static bool ParsePrimitiveType(string[] input, ref int index, ref CppType result)
        {
            if (ParseSignedUnsigned(input, ref index))
            {
                if (ParseInt(input, ref index))
                {
                    result = new CppType()
                    {
                        Name = input[index - 2] + " " + input[index - 1],
                    };
                    return true;
                }
                else
                {
                    throw new ArgumentException(string.Format("{0} is not a valid type.", input[index - 2] + " " + input[index - 1]));
                }
            }
            else if (ParseName(input, ref index))
            {
                result = new CppType()
                {
                    Name = input[index - 1],
                };
                return true;
            }
            else
            {
                return false;
            }
        }

        private static bool ParseType(string raw, string[] input, ref int index, ref CppType result)
        {
            if (ParsePrimitiveType(input, ref index, ref result))
            {
                while (true)
                {
                    if (ParseString(input, ref index, "__cdecl", "__clrcall", "__stdcall", "__fastcall", "__thiscall"))
                    {
                        result.CallingConversion = input[index - 1];
                    }
                    if (ParseString(input, ref index, "<") || ParseString(input, ref index, "("))
                    {
                        if (result.CallingConversion != "" && input[index - 1] == "<")
                        {
                            throw new ArgumentException(string.Format("Token \"(\" is missing in {0}.", raw));
                        }
                        string endToken = input[index - 1] == "<" ? ">" : ")";
                        CppDecoration decoration = input[index - 1] == "<" ? CppDecoration.Template : CppDecoration.Function;
                        List<CppType> arguments = new List<CppType>();
                        while (true)
                        {
                            CppType argument = null;
                            if (ParseType(raw, input, ref index, ref argument))
                            {
                                arguments.Add(argument);
                                if (ParseString(input, ref index, endToken))
                                {
                                    break;
                                }
                                else if (!ParseString(input, ref index, ","))
                                {
                                    throw new ArgumentException(string.Format("Token \",\" is missing in {0}.", raw));
                                }
                            }
                            else
                            {
                                throw new ArgumentException(string.Format("Type is missing in {0}.", raw));
                            }
                        }
                        result.Decoration = decoration;
                        result.Arguments = arguments.ToArray();
                    }
                    else if (ParseVCRP(input, ref index))
                    {
                        result = new CppType()
                        {
                            Name = input[index - 1],
                            Decoration = CppDecoration.Decoration,
                            Arguments = new CppType[] { result },
                        };
                    }
                    else
                    {
                        break;
                    }
                }
                return true;
            }
            return false;
        }

        public static CppType Parse(string input)
        {
            List<string> pieces = new List<string>();
            int index = 0;
            while (true)
            {
                int find = input.IndexOfAny("<> ,*&()".ToCharArray(), index);
                if (find == -1)
                {
                    pieces.Add(input.Substring(index, input.Length - index));
                    break;
                }
                else
                {
                    pieces.Add(input.Substring(index, find - index));
                    pieces.Add(input.Substring(find, 1));
                    index = find + 1;
                }
            }

            index = 0;
            string[] tokens = pieces.Where(s => !string.IsNullOrWhiteSpace(s)).ToArray();
            CppType type = null;
            if (!ParseType(input, tokens, ref index, ref type))
            {
                throw new ArgumentException(string.Format("Completely not understand what type is {0}.", input));
            }
            else if (index != tokens.Length)
            {
                throw new ArgumentException(string.Format("Only a prefix of {0} is parsed.", input));
            }
            return type;
        }
    }
}
