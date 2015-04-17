using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Xml.Linq;
using PdbTypeParser;

namespace LinkPdbXml
{
    class DocFunction
    {
        public string Name { get; set; }
        public GacMethod Method { get; set; }
        public XElement MethodDocItem { get; set; }

        public override string ToString()
        {
            return this.Name;
        }

        public XElement ToXElement()
        {
            return new XElement("function",
                new XAttribute("name", this.Name),
                new XAttribute("fullName", this.Method.Name),
                new XAttribute("isStatic", this.Method.OwnerUDT == null ? true : this.Method.OwnerUDT.Methods.Contains(this.Method)),
                new XAttribute("access", this.Method.Access),
                new XAttribute("kind", this.Method.Kind),
                new XElement("returnType", this.Method.Type.ReturnType.ToString()),
                this.Method.Type.ParameterTypes
                    .Select(t => new XElement("parameterType", t.ToString()))
                    .ToArray(),
                this.Method.ParameterNames.Zip(
                    this.Method.Type.ParameterTypes,
                    (a, b) => new XElement("parameterPair",
                        new XAttribute("name", a),
                        b.ToString()
                        )
                    )
                    .ToArray(),
                new XElement("document", this.MethodDocItem)
                );
        }
    }

    class DocField
    {
        public string Name { get; set; }
        public GacField Field { get; set; }
        public XElement FieldDocItem { get; set; }

        public override string ToString()
        {
            return this.Name;
        }

        public XElement ToXElement()
        {
            return new XElement("field",
                new XAttribute("name", this.Name),
                new XAttribute("fullName", this.Field.Name),
                new XAttribute("isStatic", !this.Field.OwnerUDT.Fields.Contains(this.Field)),
                new XAttribute("access", this.Field.Access),
                new XElement("type", this.Field.Type.ToString()),
                new XElement("document", this.FieldDocItem)
                );
        }
    }

    class DocItemContainer
    {
        public Dictionary<string, DocType> Types { get; private set; }
        public Dictionary<string, List<DocFunction>> Functions { get; private set; }
        public Dictionary<string, DocField> Fields { get; private set; }

        public DocItemContainer()
        {
            this.Types = new Dictionary<string, DocType>();
            this.Functions = new Dictionary<string, List<DocFunction>>();
            this.Fields = new Dictionary<string, DocField>();
        }

        public DocType GetType(string name)
        {
            DocType type = null;
            if (!this.Types.TryGetValue(name, out type))
            {
                type = new DocType() { Name = name };
                this.Types.Add(type.Name, type);
            }
            return type;
        }

        public void AddFunction(DocFunction docFunction)
        {
            List<DocFunction> functions = null;
            if (!this.Functions.TryGetValue(docFunction.Name, out functions))
            {
                functions = new List<DocFunction>();
                this.Functions.Add(docFunction.Name, functions);
            }
            functions.Add(docFunction);
        }

        public void AddField(DocField docField)
        {
            this.Fields.Add(docField.Name, docField);
        }
    }

    class DocBaseType
    {
        public DocType Type { get; set; }
        public GacBaseClass BaseClass { get; set; }

        public override string ToString()
        {
            return this.BaseClass.Access.ToString() + " " + this.Type.ToString();
        }

        public XElement ToXElement()
        {
            return new XElement("baseType",
                new XAttribute("fullName", this.BaseClass.UDT.Name),
                new XAttribute("access", this.BaseClass.Access.ToString())
                );
        }
    }

    class DocType : DocItemContainer
    {
        public string Name { get; set; }
        public DocBaseType[] BaseTypes { get; set; }
        public GacUDT Udt { get; set; }
        public XElement UdtDocItem { get; set; }

        public override string ToString()
        {
            return this.Name;
        }

        public XElement ToXElement()
        {
            return new XElement(this.Udt.Kind == GacUDTKind.Class ? "type" : "enum",
                new XAttribute("name", this.Name),
                new XAttribute("fullName", this.Udt.Name),
                new XElement("document", this.UdtDocItem),
                this.BaseTypes.Select(t => t.ToXElement()).ToArray(),
                this.Types.Select(t => t.Value.ToXElement()).ToArray(),
                this.Functions.Select(t =>
                    new XElement("functionGroup",
                        new XAttribute("name", t.Key),
                        t.Value.Select(f => f.ToXElement()).ToArray()
                        )
                    ).ToArray(),
                this.Fields.Select(t => t.Value.ToXElement()).ToArray()
                );
        }
    }

    class DocNamespace : DocItemContainer
    {
        public string Name { get; set; }
        public Dictionary<string, DocNamespace> Namespaces { get; private set; }

        public DocNamespace()
        {
            this.Name = "";
            this.Namespaces = new Dictionary<string, DocNamespace>();
        }

        public override string ToString()
        {
            return this.Name;
        }

        public DocNamespace GetNamespace(IEnumerable<string> namespaces)
        {
            string first = namespaces.FirstOrDefault();
            if (first == null)
            {
                return this;
            }
            else
            {
                DocNamespace ns = null;
                if (!this.Namespaces.TryGetValue(first, out ns))
                {
                    ns = new DocNamespace() { Name = first };
                    this.Namespaces.Add(ns.Name, ns);
                }
                return ns.GetNamespace(namespaces.Skip(1));
            }
        }

        public XElement ToXElement()
        {
            return new XElement("namespace",
                new XAttribute("name", this.Name),
                this.Namespaces.Select(t => t.Value.ToXElement()).ToArray(),
                this.Types.Select(t => t.Value.ToXElement()).ToArray(),
                this.Functions.Select(t =>
                    new XElement("functionGroup",
                        new XAttribute("name", t.Key),
                        t.Value.Select(f => f.ToXElement()).ToArray()
                        )
                    ).ToArray(),
                this.Fields.Select(t => t.Value.ToXElement()).ToArray()
                );
        }
    }

    class DocRootNamespace : DocNamespace
    {
        private Dictionary<GacUDT, DocType> typeCache = new Dictionary<GacUDT, DocType>();

        public DocType GetType(GacUDT udt, Dictionary<string, GacUDT> udts)
        {
            DocType resultType = null;
            if (!this.typeCache.TryGetValue(udt, out resultType))
            {
                CppName cppName = CppName.Parse(udt.Name);
                var cascadeNames = cppName
                    .Cascade()
                    .Select(c => new CppName()
                        {
                            Name = c.Name,
                            Parameters = c.Parameters,
                        }.ToPdbString())
                    .ToArray();

                string currentName = "";
                int namespaceCount = 0;
                for (int i = 0; i < cascadeNames.Length; i++)
                {
                    currentName += (i == 0 ? "" : "::") + cascadeNames[i];
                    if (udts.ContainsKey(currentName)) break;
                    namespaceCount = i + 1;
                }

                DocItemContainer ic = GetNamespace(cascadeNames.Take(namespaceCount));
                for (int i = namespaceCount; i < cascadeNames.Length; i++)
                {
                    ic = ic.GetType(cascadeNames[i]);
                }
                resultType = (DocType)ic;
                resultType.Udt = udt;
                this.typeCache.Add(udt, resultType);
            }
            return resultType;
        }
    }

    static class DocItemSerializer
    {
        class DocTypeInfo
        {
            public XElement TypeDocItem { get; set; }
            public Tuple<XElement, GacMethod>[] Methods { get; set; }
            public Tuple<XElement, GacField>[] Fields { get; set; }
        }

        static void FillFunction(DocFunction docFunction, Tuple<XElement, GacMethod> method)
        {
            docFunction.Name = CppName.Parse(method.Item2.Name).Cascade().Last().Name;
            docFunction.Method = method.Item2;
            docFunction.MethodDocItem = method.Item1;
        }

        static DocFunction BuildFunction(DocItemContainer ic, Tuple<XElement, GacMethod> method)
        {
            DocFunction docFunction = new DocFunction();
            FillFunction(docFunction, method);
            ic.AddFunction(docFunction);
            return docFunction;
        }

        static void FillField(DocField docField, Tuple<XElement, GacField> field)
        {
            docField.Name = CppName.Parse(field.Item2.Name).Cascade().Last().Name;
            docField.Field = field.Item2;
            docField.FieldDocItem = field.Item1;
        }

        static DocField BuildField(DocItemContainer ic, Tuple<XElement, GacField> field)
        {
            DocField docField = new DocField();
            FillField(docField, field);
            ic.AddField(docField);
            return docField;
        }

        static void FillType(DocType type, KeyValuePair<GacUDT, DocTypeInfo> info, DocRootNamespace root, Dictionary<string, GacUDT> udts, HashSet<GacUDT> hashUdts)
        {
            type.UdtDocItem = info.Value.TypeDocItem;
            type.BaseTypes = info.Key
                .BaseClasses
                .Where(b => b.Access != GacAccess.Private)
                .Where(b => hashUdts.Contains(b.UDT))
                .Select(b => new DocBaseType
                {
                    Type = root.GetType(b.UDT, udts),
                    BaseClass = b,
                })
                .ToArray();
            foreach (var m in info.Value.Fields)
            {
                BuildField(type, m);
            }
            foreach (var m in info.Value.Methods)
            {
                BuildFunction(type, m);
            }
        }

        static DocRootNamespace Categorize(Dictionary<GacUDT, DocTypeInfo> typeGroupedItems, Tuple<XElement, GacMethod>[] gfuncItems, Dictionary<string, GacUDT> udts)
        {
            HashSet<GacUDT> hashUdts = new HashSet<GacUDT>(typeGroupedItems.Keys);
            DocRootNamespace root = new DocRootNamespace();
            foreach (var p in typeGroupedItems)
            {
                DocType type = root.GetType(p.Key, udts);
                FillType(type, p, root, udts, hashUdts);
            }
            foreach (var m in gfuncItems)
            {
                CppName[] names = CppName.Parse(m.Item2.Name).Cascade().ToArray();
                string[] nsNames = names.Take(names.Length - 1).Select(n => n.Name).ToArray();
                var ns = root.GetNamespace(nsNames);
                BuildFunction(ns, m);
            }
            return root;
        }

        public static XElement Serialize(Dictionary<string, Tuple<XElement, GacSymbol>> docItems, Dictionary<string, GacUDT> udts, Dictionary<string, GacMethod[]> funcs)
        {
            var typeItems = docItems.Values
                .Select(v => Tuple.Create(v.Item1, v.Item2 as GacUDT))
                .Where(v => v.Item2 != null)
                .ToDictionary(v => v.Item2, v => v.Item1);

            var mfieldItems = docItems.Values
                .Select(v => Tuple.Create(v.Item1, v.Item2 as GacField))
                .Where(v => v.Item2 != null)
                .GroupBy(v => v.Item2.OwnerUDT)
                .ToDictionary(g => g.Key, g => g.ToArray());

            var funcItems = docItems.Values
                .Select(v => Tuple.Create(v.Item1, v.Item2 as GacMethod))
                .Where(v => v.Item2 != null)
                .ToArray();

            var gfuncItems = funcItems
                .Where(v => v.Item2.OwnerUDT == null)
                .ToArray();

            var mfuncItems = funcItems
                .Where(v => v.Item2.OwnerUDT != null)
                .GroupBy(v => v.Item2.OwnerUDT)
                .ToDictionary(g => g.Key, g => g.ToArray());

            var typeGroupedItems =
                typeItems.Keys.Concat(mfuncItems.Keys).Distinct()
                .ToDictionary(t => t, t =>
                    {
                        XElement typeDocItem = null;
                        typeItems.TryGetValue(t, out typeDocItem);

                        Tuple<XElement, GacMethod>[] mfuncDocItems = new Tuple<XElement, GacMethod>[0];
                        mfuncItems.TryGetValue(t, out mfuncDocItems);

                        Tuple<XElement, GacField>[] mfieldDocItems = new Tuple<XElement, GacField>[0];
                        mfieldItems.TryGetValue(t, out mfieldDocItems);

                        return new DocTypeInfo
                        {
                            TypeDocItem = typeDocItem,
                            Methods = mfuncDocItems ?? new Tuple<XElement, GacMethod>[0],
                            Fields = mfieldDocItems ?? new Tuple<XElement, GacField>[0],
                        };
                    });

            var docAssembly = Categorize(typeGroupedItems, gfuncItems, udts);

            XElement root = new XElement("cppdoc", docAssembly.ToXElement());
            return root;
        }
    }
}
