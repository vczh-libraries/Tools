using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Xml.Linq;

namespace PdbTypeParser
{
    public enum GacUDTKind
    {
        Class,
        Enum,
    }

    public enum GacTypeKind
    {
        Primitive,
        SmartPointer,
        Pointer,
        Reference,
        RValueReference,
        Array,
        Function,
        Const,
        Volatile,
        UDT,
    }

    public enum GacAccess
    {
        Private,
        Protected,
        Public,
    }

    public enum GacMethodKind
    {
        Abstract,
        Virtual,
        Normal,
    }

    public class GacSymbol
    {
        public string Name { get; set; }
    }

    public class GacUDT : GacSymbol
    {
        public bool IsAbstract { get; set; }
        public GacUDTKind Kind { get; set; }
        public GacBaseClass[] BaseClasses { get; set; }
        public GacField[] Fields { get; set; }
        public GacField[] StaticFields { get; set; }
        public GacConst[] Constants { get; set; }
        public GacMethod[] Methods { get; set; }
        public GacMethod[] StaticMethods { get; set; }

        public override string ToString()
        {
            return this.Name;
        }
    }

    public class GacType
    {
        private string name = "";
        public string Name
        {
            get
            {
                return this.name;
            }
            set
            {
                this.name = value;
                while (true)
                {
                    string replaced = this.name.Replace("> >", ">>");
                    if (replaced == this.name) break;
                    this.name = replaced;
                }
            }
        }
        public GacTypeKind Kind { get; set; }
        public GacType ElementType { get; set; }
        public int ArrayLength { get; set; }
        public GacType ReturnType { get; set; }
        public GacType[] ParameterTypes { get; set; }
        public string CallingConversion { get; set; }
        public GacUDT AssociatedUDT { get; set; }

        public override string ToString()
        {
            return this.name;
        }
    }

    public class GacBaseClass
    {
        public GacAccess Access { get; set; }
        public GacUDT UDT { get; set; }
    }

    public class GacField : GacSymbol
    {
        public GacAccess Access { get; set; }
        public GacType Type { get; set; }
        public GacUDT OwnerUDT { get; set; }

        public override string ToString()
        {
            return this.Name;
        }
    }

    public class GacConst : GacField
    {
        public int EnumItemValue { get; set; }

        public override string ToString()
        {
            return this.Name + " = " + this.EnumItemValue.ToString();
        }
    }

    public class GacMethod : GacSymbol
    {
        public GacMethodKind Kind { get; set; }
        public GacAccess Access { get; set; }
        public GacType Type { get; set; }
        public string[] ParameterNames { get; set; }
        public GacUDT OwnerUDT { get; set; }

        public override string ToString()
        {
            return this.Name;
        }
    }

    public static class TypeDefinitions
    {
        static GacType DecorateType(GacType type, XElement typeElement)
        {
            if (typeElement.Attribute("const").Value == "true")
            {
                type = new GacType
                {
                    Name = type.Name + " const",
                    Kind = GacTypeKind.Const,
                    ElementType = type,
                };
            }
            if (typeElement.Attribute("volatile").Value == "true")
            {
                type = new GacType
                {
                    Name = type.Name + " volatile",
                    Kind = GacTypeKind.Volatile,
                    ElementType = type,
                };
            }
            return type;
        }

        static GacType TranslateTypeInternal(Dictionary<string, GacUDT> udts, XElement typeElement)
        {
            switch (typeElement.Name.LocalName)
            {
                case "primitive":
                    return new GacType
                    {
                        Name = typeElement.Attribute("name").Value,
                        Kind = GacTypeKind.Primitive,
                    };
                case "classType":
                case "enumType":
                    {
                        string name = typeElement.Attribute("name").Value;
                        if (name.StartsWith("vl::Ptr<"))
                        {
                            string newName = name.Substring(8, name.Length - 9).Trim();
                            return new GacType
                            {
                                Name = name,
                                Kind = GacTypeKind.SmartPointer,
                                ElementType = new GacType
                                {
                                    Name = newName,
                                    Kind = GacTypeKind.UDT,
                                    AssociatedUDT = udts[newName],
                                },
                            };
                        }
                        else
                        {
                            return new GacType
                            {
                                Name = name,
                                Kind = GacTypeKind.UDT,
                                AssociatedUDT = udts[name],
                            };
                        }
                    }
                case "pointer":
                    {
                        GacType elementType = TranslateType(udts, typeElement.Elements().First());
                        return new GacType
                        {
                            Name = elementType.Name + "*",
                            Kind = GacTypeKind.Pointer,
                            ElementType = elementType,
                        };
                    }
                case "reference":
                    {
                        GacType elementType = TranslateType(udts, typeElement.Elements().First());
                        return new GacType
                        {
                            Name = elementType.Name + "&",
                            Kind = GacTypeKind.Reference,
                            ElementType = elementType,
                        };
                    }
                case "rightValueReference":
                    {
                        GacType elementType = TranslateType(udts, typeElement.Elements().First());
                        return new GacType
                        {
                            Name = elementType.Name + "&&",
                            Kind = GacTypeKind.RValueReference,
                            ElementType = elementType,
                        };
                    }
                case "array":
                    {
                        GacType elementType = TranslateType(udts, typeElement.Element("element").Elements().First());
                        int arrayLength = int.Parse(typeElement.Element("count").Attribute("value").Value);
                        return new GacType
                        {
                            Name = elementType.Name + "[" + arrayLength.ToString() + "]",
                            Kind = GacTypeKind.Array,
                            ElementType = elementType,
                            ArrayLength = arrayLength,
                        };
                    }
                case "function":
                    {
                        GacType returnType = TranslateType(udts, typeElement.Element("return").Elements().First());
                        GacType[] parameterTypes = typeElement.Element("arguments").Elements("argument")
                            .Select(e => TranslateType(udts, e.Elements().First()))
                            .ToArray();
                        string callingConversion = typeElement.Element("callconv").Attribute("value").Value;
                        return new GacType
                        {
                            Name = returnType.Name
                                + "("
                                + callingConversion
                                + ")("
                                + parameterTypes.Select(t => t.Name).Aggregate("", (a, b) => a == "" ? b : a + ", " + b)
                                + ")",
                            Kind = GacTypeKind.Function,
                            ReturnType = returnType,
                            ParameterTypes = parameterTypes,
                            CallingConversion = callingConversion,
                        };
                    }
                default:
                    throw new ArgumentException();
            }
        }

        static GacType TranslateType(Dictionary<string, GacUDT> udts, XElement typeElement)
        {
            return DecorateType(TranslateTypeInternal(udts, typeElement), typeElement);
        }

        static GacAccess TranslateAccess(string value)
        {
            switch (value)
            {
                case "private": return GacAccess.Private;
                case "protected": return GacAccess.Protected;
                case "public": return GacAccess.Public;
                case "": return GacAccess.Public;
                default: throw new ArgumentException();
            }
        }

        static GacMethodKind TranslateVirtual(string value)
        {
            switch (value)
            {
                case "pure": return GacMethodKind.Abstract;
                case "virtual": return GacMethodKind.Virtual;
                case "normal": return GacMethodKind.Normal;
                case "": return GacMethodKind.Normal;
                default: throw new ArgumentException();
            }
        }

        static GacField TranslateField(Dictionary<string, GacUDT> udts, XElement fieldElement, GacUDT ownerUDT)
        {
            return new GacField
            {
                Name = fieldElement.Attribute("name").Value,
                Access = TranslateAccess(fieldElement.Attribute("access").Value),
                Type = TranslateType(udts, fieldElement.Element("type").Elements().First()),
                OwnerUDT = ownerUDT,
            };
        }

        static GacConst TranslateEnumField(Dictionary<string, GacUDT> udts, XElement fieldElement, GacUDT ownerUDT)
        {
            GacField field = TranslateField(udts, fieldElement, ownerUDT);
            return new GacConst
            {
                Name = field.Name,
                Access = field.Access,
                Type = field.Type,
                OwnerUDT = field.OwnerUDT,
                EnumItemValue = int.Parse(fieldElement.Element("intValue").Attribute("value").Value),
            };
        }

        static GacMethod TranslateMethod(Dictionary<string, GacUDT> udts, XElement methodElement, GacUDT ownerUDT)
        {
            return new GacMethod
            {
                Name = methodElement.Attribute("name").Value,
                Kind = TranslateVirtual(methodElement.Attribute("virtual").Value),
                Access = TranslateAccess(methodElement.Attribute("access").Value),
                Type = TranslateType(udts, methodElement.Element("type").Elements().First()),
                ParameterNames = methodElement.Element("arguments").Elements("argument").Select(e => e.Attribute("name").Value).ToArray(),
                OwnerUDT = ownerUDT,
            };
        }

        static void FillUdt(Dictionary<string, GacUDT> udts, GacUDT udt, XElement udtElement)
        {
            udt.BaseClasses = udtElement.Element("baseClasses") == null ? new GacBaseClass[0] : udtElement
                .Element("baseClasses")
                .Elements("baseClass")
                .Select(e => new GacBaseClass
                {
                    Access = TranslateAccess(e.Attribute("access").Value),
                    UDT = udts[e.Attribute("name").Value],
                })
                .ToArray();
            udt.Fields = udtElement.Element("fields") == null ? new GacField[0] : udtElement
                .Element("fields")
                .Elements("field")
                .Select(e => TranslateField(udts, e, udt))
                .ToArray();
            udt.StaticFields = udtElement.Element("fields") == null ? new GacField[0] : udtElement
                .Element("fields")
                .Elements("staticField")
                .Select(e => TranslateField(udts, e, udt))
                .ToArray();
            udt.Constants = udtElement.Element("fields") == null ? new GacConst[0] : udtElement
                .Element("fields")
                .Elements("const")
                .Select(e => TranslateEnumField(udts, e, udt))
                .ToArray();
            udt.Methods = udtElement.Element("methods") == null ? new GacMethod[0] : udtElement
                .Element("methods")
                .Elements("method")
                .Select(e => TranslateMethod(udts, e, udt))
                .ToArray();
            udt.StaticMethods = udtElement.Element("methods") == null ? new GacMethod[0] : udtElement
                .Element("methods")
                .Elements("staticMethod")
                .Select(e => TranslateMethod(udts, e, udt))
                .ToArray();
            udt.IsAbstract = udt.Methods.Any(m => m.Kind == GacMethodKind.Abstract);
        }

        static GacUDT[] GetBaseClasses(GacUDT udt)
        {
            return udt.BaseClasses.Select(b => b.UDT).Concat(udt.BaseClasses.SelectMany(b => GetBaseClasses(b.UDT))).ToArray();
        }

        public static Dictionary<string, GacUDT> LoadTypes(XDocument document)
        {
            Dictionary<string, GacUDT> udts = new Dictionary<string, GacUDT>();
            foreach (var udtElement in document.Root.Elements().Where(e => e.Name != "functions"))
            {
                GacUDT udt = new GacUDT();
                udt.Name = udtElement.Attribute("name").Value;
                switch (udtElement.Name.LocalName)
                {
                    case "class":
                        udt.Kind = GacUDTKind.Class;
                        break;
                    case "enum":
                        udt.Kind = GacUDTKind.Enum;
                        break;
                }
                udts.Add(udt.Name, udt);
            }
            foreach (var udtElement in document.Root.Elements().Where(e => e.Name != "functions"))
            {
                FillUdt(udts, udts[udtElement.Attribute("name").Value], udtElement);
            }
            foreach (var udt in udts.Values)
            {
                List<GacBaseClass> newBaseClasses = new List<GacBaseClass>();
                HashSet<GacUDT> baseBaseClasses = new HashSet<GacUDT>(udt.BaseClasses.SelectMany(b => GetBaseClasses(b.UDT)));
                foreach (var baseUdt in udt.BaseClasses)
                {
                    if (!baseBaseClasses.Contains(baseUdt.UDT))
                    {
                        newBaseClasses.Add(baseUdt);
                    }
                }
                udt.BaseClasses = newBaseClasses.ToArray();
            }
            return udts;
        }

        public static Dictionary<string, GacMethod[]> LoadFunctions(Dictionary<string, GacUDT> udts, XDocument document)
        {
            var methods = document.Root.Element("functions").Elements("method")
                .Select(e => TranslateMethod(udts, e, null))
                .GroupBy(m => m.Name)
                .ToDictionary(g => g.Key, g => g.ToArray());
            return methods;
        }
    }
}
