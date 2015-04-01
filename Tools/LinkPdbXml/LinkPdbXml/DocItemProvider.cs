using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Xml.Linq;
using PdbTypeParser;

namespace LinkPdbXml
{
    static class DocItemProvider
    {
        static string ConvertDocNameToCppName(string name)
        {
            return name.Replace(".", "::");
        }

        static string[] SplitParameters(string methodParameters)
        {
            List<int> indices = new List<int>();
            indices.Add(-1);
            {
                int templates = 0;
                for (int i = 0; i < methodParameters.Length; i++)
                {
                    switch (methodParameters[i])
                    {
                        case '<':
                            templates++;
                            break;
                        case '>':
                            templates--;
                            break;
                        case ',':
                            if (templates == 0) indices.Add(i);
                            break;
                    }
                }
            }
            indices.Add(methodParameters.Length);
            var pairs = indices.Take(indices.Count - 1).Zip(indices.Skip(1), (a, b) => Tuple.Create(a, b)).ToArray();
            var rawParameterTypes = pairs.Select(p => methodParameters.Substring(p.Item1 + 1, p.Item2 - p.Item1 - 1)).ToArray();

            return rawParameterTypes
                .Select(s => s
                    .Replace("!System.Runtime.CompilerServices.IsConst", " const")
                    .Replace("*!System.Runtime.CompilerServices.IsImplicitlyDereferenced", "&")
                    .Replace("System.Boolean", "bool")
                    .Replace("System.Char", "wchar_t")
                    .Replace("System.Single", "float")
                    .Replace("System.Double", "double")
                    .Replace("System.SByte", "signed __int8")
                    .Replace("System.Int16", "signed __int16")
                    .Replace("System.Int32", "signed __int32")
                    .Replace("System.Int64", "signed __int64")
                    .Replace("System.Byte", "signed __int8")
                    .Replace("System.UInt16", "unsigned __int16")
                    .Replace("System.UInt32", "unsigned __int32")
                    .Replace("System.UInt64", "unsigned __int64")
                    .Replace(".", "::")
                    )
                .ToArray();
        }

        // methodParameters can be
        // (vl.presentation.TextPos,vl.presentation.TextPos,vl.ObjectString<System.Char>!System.Runtime.CompilerServices.IsConst*!System.Runtime.CompilerServices.IsImplicitlyDereferenced)
        static GacMethod TryPickFunction(GacMethod[] funcs, string methodParameters)
        {
            switch (funcs.Length)
            {
                case 0: return null;
                case 1: return funcs[0];
                default:
                    {
                        var parameters =
                            methodParameters == ""
                            ? new string[0]
                            : SplitParameters(methodParameters.Substring(1, methodParameters.Length - 2))
                            ;
                        var selectableFuncs = funcs
                            .Where(f => f.Type.ParameterTypes.Length == parameters.Length)
                            .ToArray();
                        if (selectableFuncs.Length != 1)
                        {
                            selectableFuncs = selectableFuncs
                                .Where(f => f.Type.ParameterTypes.Select((t, i) => t.Name == parameters[i]).All(t => t))
                                .ToArray();
                        }
                        return selectableFuncs.Length == 1 ? selectableFuncs[0] : null;
                    }
            }
        }

        static GacMethod PickFunction(GacMethod[] funcs, string methodParameters)
        {
            GacMethod method = TryPickFunction(funcs, methodParameters);
            if (method == null)
            {
                throw new ArgumentException();
            }
            return method;
        }

        static GacMethod TryPickFunction(GacUDT udt, GacMethod[] methods, string methodLocalName, string methodParameters)
        {
            var candidates1 = methods.Where(m => m.Name == udt.Name + "::" + methodLocalName).ToArray();
            var candidates2 = methods.Where(m => m.Name == methodLocalName).ToArray();
            var result = TryPickFunction(candidates1.Concat(candidates2).ToArray(), methodParameters);
            return result;
        }

        static GacMethod PickFunction(GacUDT udt, string methodLocalName, string methodParameters)
        {
            if (methodLocalName == "#ctor")
            {
                CppName cppName = CppName.Parse(udt.Name);
                methodLocalName = cppName.Cascade().Last().Name;
            }
            var m1 = TryPickFunction(udt, udt.Methods, methodLocalName, methodParameters);
            var m2 = TryPickFunction(udt, udt.StaticMethods, methodLocalName, methodParameters);
            if ((m1 == null) ^ (m2 == null) != true)
            {
                throw new ArgumentException();
            }
            return m1 ?? m2;
        }

        static GacField PickField(GacUDT udt, string fieldLocalName)
        {
            var fields =
                udt.Constants.Concat(udt.Fields).Concat(udt.StaticFields)
                .Where(f => f.Name == fieldLocalName)
                .ToArray();
            if (fields.Length != 1)
            {
                throw new ArgumentException();
            }
            return fields[0];
        }

        public static GacSymbol FindSymbol(XElement docItem, Dictionary<string, GacUDT> udts, Dictionary<string, GacMethod[]> funcs)
        {
            string name = docItem.Attribute("name").Value;
            string head = name.Substring(0, 2);
            name = name.Substring(2);
            switch (head)
            {
                case "T:":
                    {
                        string className = ConvertDocNameToCppName(name);
                        return udts[className];
                    }
                case "F:":
                    {
                        string typeName = "";
                        string fieldLocalName = "";
                        {
                            int pointIndex = name.LastIndexOf('.');
                            typeName = ConvertDocNameToCppName(name.Substring(0, pointIndex));
                            fieldLocalName = name.Substring(pointIndex + 1);
                        }

                        GacUDT udt = udts[typeName];
                        return PickField(udt, fieldLocalName);
                    }
                case "M:":
                    {
                        string methodName = name;
                        string methodParameters = "";
                        {
                            int bracketIndex = methodName.IndexOf('(');
                            if (bracketIndex != -1)
                            {
                                methodName = name.Substring(0, bracketIndex);
                                methodParameters = name.Substring(bracketIndex);
                            }
                        }

                        string containerName = "";
                        string methodLocalName = methodName;
                        {
                            int pointIndex = methodName.LastIndexOf('.');
                            if (pointIndex != -1)
                            {
                                containerName = methodName.Substring(0, pointIndex);
                                methodLocalName = methodName.Substring(pointIndex + 1);
                            }
                        }

                        if (containerName != "")
                        {
                            string className = ConvertDocNameToCppName(containerName);
                            GacUDT udt = null;
                            if (udts.TryGetValue(className, out udt))
                            {
                                return PickFunction(udt, methodLocalName, methodParameters);
                            }
                        }
                        string methodFullName = ConvertDocNameToCppName(methodName);
                        return PickFunction(funcs[methodFullName], methodParameters);
                    }
                default:
                    throw new ArgumentException();
            }
        }
    }
}
