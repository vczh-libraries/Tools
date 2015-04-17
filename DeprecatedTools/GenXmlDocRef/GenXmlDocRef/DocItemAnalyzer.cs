using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Xml.Linq;
using System.IO;

namespace GenXmlDocRef
{
    static class DocItemAnalyzer
    {
        static void BuildItems(DocItem docItem, XElement docXml, List<Tuple<string, XElement>> namespaces)
        {
            switch (docXml.Name.ToString())
            {
                case "cppdoc":
                    {
                        foreach (var subXml in docXml.Elements())
                        {
                            BuildItems(docItem, subXml, namespaces);
                        }
                    }
                    break;
                case "namespace":
                    {
                        namespaces.Add(Tuple.Create(docXml.Attribute("name").Value, docXml));
                        foreach (var subXml in docXml.Elements())
                        {
                            BuildItems(docItem, subXml, namespaces);
                        }
                        namespaces.RemoveAt(namespaces.Count - 1);
                    }
                    break;
                case "enum":
                    {
                        string typeName = docXml.Attribute("name").Value;
                        string fullName = docXml.Attribute("fullName").Value;
                        string[] namespaceNames = null;
                        Tuple<string, XElement> lastNamespace = null;
                        if (typeName == "Type" && namespaces.Count > 0)
                        {
                            var siblings = docXml.Parent.Elements().ToArray();
                            if (siblings.Length != 1 && siblings[0] != docXml)
                            {
                                throw new ArgumentException();
                            }
                            typeName = namespaces.Last().Item1 + "::" + typeName;
                            lastNamespace = namespaces.Take(namespaces.Count - 1).LastOrDefault();
                            namespaceNames = namespaces.Take(namespaces.Count - 1).Select(t => t.Item1).ToArray();
                        }
                        else
                        {
                            lastNamespace = namespaces.LastOrDefault();
                            namespaceNames = namespaces.Select(t => t.Item1).ToArray();
                        }

                        DocItem typeItem = new DocItem()
                        {
                            Name = "enum_" + fullName.Replace("::", "_"),
                            UniqueId = "enum:" + fullName,
                            Title = typeName + " Enumeration",
                            Content = docXml,
                            Document = docXml.Element("document"),
                        };

                        docItem.AddSymbolDocItem(typeItem, (lastNamespace == null ? null : lastNamespace.Item2), namespaceNames);
                    }
                    break;
                case "type":
                    {
                        string typeName = docXml.Attribute("name").Value;
                        string fullName = docXml.Attribute("fullName").Value;
                        string[] namespaceNames = namespaces.Select(t => t.Item1).ToArray();

                        DocItem typeItem = new DocItem()
                        {
                            Name = "type_" + fullName.Replace("::", "_"),
                            UniqueId = "type:" + fullName,
                            Title = typeName + " Class",
                            Content = docXml,
                        };

                        docItem.AddSymbolDocItem(typeItem, namespaces, namespaceNames);
                        foreach (var subXml in docXml.Elements())
                        {
                            BuildItems(typeItem, subXml, namespaces);
                        }
                    }
                    break;
                case "functionGroup":
                    {
                        var functions = docXml.Elements().ToArray();
                        if (functions.Length == 1)
                        {
                            BuildItems(docItem, functions[0], namespaces);
                        }
                        else
                        {
                            if (functions.Length == 0)
                            {
                                throw new ArgumentException();
                            }
                            string functionName = docXml.Attribute("name").Value;
                            string[] namespaceNames = namespaces.Select(t => t.Item1).ToArray();

                            string nameBody = "";
                            string uniqueIdBody = "";
                            if (docItem.Parent == null)
                            {
                                string[] names = namespaceNames.Where(s => s != "").ToArray();
                                if (names.Length > 0)
                                {
                                    nameBody = names.Aggregate((a, b) => a + "_" + b);
                                    uniqueIdBody = names.Aggregate((a, b) => a + "::" + b);
                                }
                            }
                            else
                            {
                                nameBody = docItem.NameBody;
                                uniqueIdBody = docItem.UniqueIdBody;
                            }

                            DocItem functionItem = new DocItem()
                            {
                                Name = "functionGroup_" + nameBody + "_" + functionName,
                                UniqueId = "functionGroup:" + uniqueIdBody + "::" + functionName,
                                Title = functionName + " Functions(overloading)",
                                Content = docXml,
                            };
                            docItem.AddSymbolDocItem(functionItem, namespaces, namespaceNames);
                            foreach (var subXml in functions)
                            {
                                BuildItems(functionItem, subXml, namespaces);
                            }
                        }
                    }
                    break;
                case "function":
                    {
                        string functionName = docXml.Attribute("name").Value;
                        string fullName = docXml.Attribute("fullName").Value;
                        string[] namespaceNames = namespaces.Select(t => t.Item1).ToArray();
                        if (functionName == fullName && docItem.Parent != null)
                        {
                            fullName = docItem.UniqueIdBody + "::" + functionName;
                        }
                        if (docItem.UniqueId != null && docItem.UniqueId.StartsWith("functionGroup:"))
                        {
                            fullName += "[" + docItem.SubItems.Count.ToString() + "]";
                        }
                        DocItem functionItem = new DocItem()
                        {
                            Name = "function_" + fullName.Replace("::", "_"),
                            UniqueId = "function:" + fullName,
                            Title = functionName + " Function",
                            Content = docXml,
                            Document = docXml.Element("document"),
                        };
                        docItem.AddSymbolDocItem(functionItem, namespaces, namespaceNames);
                    }
                    break;
                case "field":
                    {
                        string fieldName = docXml.Attribute("name").Value;
                        string fullName = docItem.UniqueIdBody + "::" + fieldName;
                        string[] namespaceNames = namespaces.Select(t => t.Item1).ToArray();
                        DocItem fieldItem = new DocItem()
                        {
                            Name = "field_" + fullName.Replace("::", "_"),
                            UniqueId = "field:" + fullName,
                            Title = fieldName + " Field",
                            Content = docXml,
                            Document = docXml.Element("document"),
                        };
                        docItem.AddSymbolDocItem(fieldItem, namespaces, namespaceNames);
                    }
                    break;
                case "document":
                    {
                        if (docItem.Document != null)
                        {
                            throw new ArgumentException();
                        }
                        if (!docItem.UniqueId.StartsWith("enum:") &&
                            !docItem.UniqueId.StartsWith("type:") &&
                            !docItem.UniqueId.StartsWith("function:"))
                        {
                            throw new ArgumentException();
                        }
                        docItem.Document = docXml;
                    }
                    break;
                case "baseType":
                    break;
                default:
                    throw new ArgumentException();
            }
        }

        public static DocItem GetItems(XElement docXml)
        {
            DocItem root = new DocItem();
            BuildItems(root, docXml, new List<Tuple<string, XElement>>());
            return root;
        }
    }

    class DocItem
    {
        public DocItem Parent { get; private set; }
        public string Name { get; set; }
        public string UniqueId { get; set; }
        public string Symbol { get; set; }

        public string Title { get; set; }
        public XElement Content { get; set; }
        public XElement Document { get; set; }
        public List<DocItem> SubItems { get; private set; }

        public DocItem()
        {
            this.SubItems = new List<DocItem>();
        }

        public override string ToString()
        {
            return this.Title ?? "<EMPTY>";
        }

        public string NameBody
        {
            get
            {
                if (this.Name == null) return null;
                int index = this.Name.IndexOf('_');
                return this.Name.Substring(index + 1);
            }
        }

        public string UniqueIdBody
        {
            get
            {
                if (this.UniqueId == null) return null;
                int index = this.UniqueId.IndexOf(':');
                return this.UniqueId.Substring(index + 1);
            }
        }

        public void AddDocItem(DocItem item)
        {
            if (item.Parent == null)
            {
                item.Parent = this;
                this.SubItems.Add(item);
            }
            else
            {
                throw new ArgumentException();
            }
        }

        public void AddSymbolDocItem(DocItem item, XElement namespaceXml, string[] namespaceNames)
        {
            if (this.Parent == null)
            {
                AddNamespaceDocItem(namespaceNames, namespaceXml).AddDocItem(item);
            }
            else
            {
                AddDocItem(item);
            }
        }

        public void AddSymbolDocItem(DocItem item, List<Tuple<string, XElement>> namespaces, string[] namespaceNames)
        {
            var lastNamespace = namespaces.LastOrDefault();
            AddSymbolDocItem(item, (lastNamespace == null ? null : lastNamespace.Item2), namespaceNames);
        }

        public DocItem AddNamespaceDocItem(string[] names, XElement docXml)
        {
            names = names.Where(s => s != "").ToArray();
            if (names.Length == 0)
            {
                return this;
            }
            else
            {
                string namespacePath = "namespace_" + names.Aggregate((a, b) => a + "_" + b);
                DocItem item = this.SubItems.Where(i => i.Name == namespacePath).FirstOrDefault();
                if (item == null)
                {
                    string namespaceName = names.Aggregate((a, b) => a + "::" + b);
                    item = new DocItem()
                    {
                        Name = namespacePath,
                        UniqueId = "namespace:" + namespaceName,
                        Title = namespaceName + " Namespace",
                        Content = docXml,
                    };
                    AddDocItem(item);
                }
                return item;
            }
        }

        public void BuildIndex(Dictionary<string, DocItem> uniqueIdItemMap)
        {
            if (this.Parent != null)
            {
                if (this.Name == null) throw new ArgumentException();
                if (this.UniqueId == null) throw new ArgumentException();
                if (this.Title == null) throw new ArgumentException();
                if (this.Content == null) throw new ArgumentException();
                uniqueIdItemMap.Add(this.UniqueId, this);
            }
            foreach (var item in this.SubItems)
            {
                item.BuildIndex(uniqueIdItemMap);
            }
        }

        public void Write(TextWriter writer, DocItemWriterContext context)
        {
            int index = this.UniqueId.IndexOf(':');
            string name = this.UniqueId.Substring(0, index);
            var docItemWriter = DocItemWriter.CreateWriter(name, this);
            docItemWriter.Write(this, writer, context);
        }
    }
}
