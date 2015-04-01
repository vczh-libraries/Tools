using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace PdbTypeParser
{
    public class CppName
    {
        public string Name { get; set; }
        public CppName[] Parameters { get; set; }
        public CppName Member { get; set; }

        #region Parsing

        private static string ParseName(string name, ref int index)
        {
            string result = "";
            while (index < name.Length)
            {
                bool normalChar = true;
                switch (name[index])
                {
                    case '<':
                    case '>':
                    case ',':
                    case ':':
                        normalChar = false;
                        break;
                }
                if (!normalChar) break;
                result += name[index];
                index++;

                if (result == "operator")
                {
                    result += name.Substring(index);
                    index = name.Length;
                    return result.Trim();
                }
            }
            if (string.IsNullOrWhiteSpace(result))
            {
                throw new ArgumentException();
            }
            return result.Trim();
        }

        private static bool ParseChar(string name, char c, ref int index)
        {
            while (index < name.Length && char.IsWhiteSpace(name[index]))
            {
                index++;
            }
            if (index < name.Length && name[index] == c)
            {
                index++;
                return true;
            }
            else
            {
                return false;
            }
        }

        private static CppName ParseCppName(string name, ref int index)
        {
            CppName result = new CppName();
            result.Name = ParseName(name, ref index);
            result.Parameters = new CppName[0];
            if (ParseChar(name, '<', ref index))
            {
                List<CppName> parameters = new List<CppName>();
                while (true)
                {
                    parameters.Add(ParseCppName(name, ref index));
                    if (ParseChar(name, '>', ref index))
                    {
                        break;
                    }
                    else if (!ParseChar(name, ',', ref index))
                    {
                        throw new ArgumentException();
                    }
                }
                result.Parameters = parameters.ToArray();
            }
            if (ParseChar(name, ':', ref index))
            {
                if (!ParseChar(name, ':', ref index))
                {
                    throw new ArgumentException();
                }
                result.Member = ParseCppName(name, ref index);
            }
            return result;
        }

        public static CppName Parse(string name)
        {
            int index = 0;
            CppName result = ParseCppName(name.Trim(), ref index);
            if (index != name.Length)
            {
                throw new ArgumentException();
            }
            return result;
        }

        #endregion

        public IEnumerable<CppName> Cascade()
        {
            CppName current = this;
            while (current != null)
            {
                yield return current;
                current = current.Member;
            }
        }

        public override string ToString()
        {
            return Name
                + (Parameters.Length == 0 ? "" : "<" + Parameters.Select(n => n.ToString()).Aggregate("", (a, b) => a == "" ? b : a + ", " + b) + ">")
                + (Member == null ? "" : " :: " + Member.ToString())
                ;
        }

        public string ToPdbString()
        {
            return Name
                + (Parameters.Length == 0 ? "" : "<" + Parameters.Select(n => n.ToPdbString()).Aggregate("", (a, b) => a == "" ? b : a + "," + b) + ">")
                + (Member == null ? "" : "::" + Member.ToPdbString())
                ;
        }
    }
}
