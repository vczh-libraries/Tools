using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.IO;
using System.Xml.Linq;
using System.Text.RegularExpressions;

namespace GenXmlDocRef
{
    class DocItemWriterContext
    {
        public Dictionary<string, DocItem> UniqueIdItemMap { get; set; }
        public Dictionary<string, DocItem> MemberIdItemMap { get; set; }
        public HashSet<string> UnknownPrimitiveTypes { get; set; }
    }

    abstract class DocItemWriter
    {
        public DocItem AssociatedDocItem { get; private set; }

        protected abstract void WriteContent(DocItem docItem, TextWriter writer, DocItemWriterContext context);

        public void Write(DocItem docItem, TextWriter writer, DocItemWriterContext context)
        {
            writer.WriteLine("/title:{0}", docItem.Title);
            writer.WriteLine("/uniqueId:{0}", docItem.UniqueId);
            writer.WriteLine("/parentUniqueId:{0}", docItem.Parent.UniqueId);
            if (!string.IsNullOrWhiteSpace(docItem.Symbol))
            {
                writer.WriteLine("/symbol:{0}", docItem.Symbol);
            }
            writer.WriteLine("/content");
            writer.WriteLine("/+h1/{0}/-h1//para/", docItem.Title);
            WriteContent(docItem, writer, context);
            if (docItem.SubItems.Count > 0)
            {
                writer.WriteLine("/+b/In This Section:/-b//crlf/");
                foreach (var item in docItem.SubItems
                    .OrderBy(x => x.Title)
                    )
                {
                    writer.WriteLine("/nop/    /+linkid:{0}/{1}/-linkid//crlf/", item.UniqueId, item.Title);
                }
            }
        }

        public static DocItemWriter CreateWriter(string name, DocItem docItem)
        {
            switch (name)
            {
                case "namespace": return new NamespaceDocItemWriter() { AssociatedDocItem = docItem };
                case "enum": return new EnumDocItemWriter() { AssociatedDocItem = docItem };
                case "type": return new TypeDocItemWriter() { AssociatedDocItem = docItem };
                case "functionGroup": return new FunctionGroupDocItemWriter() { AssociatedDocItem = docItem };
                case "function": return new FunctionDocItemWriter() { AssociatedDocItem = docItem };
                case "field": return new FieldDocItemWriter() { AssociatedDocItem = docItem };
                default: throw new ArgumentException(string.Format("Cannot create DocItemWriter for {0}.", name));
            }
        }

        private static Regex symbolRegex = new Regex(@"\[(?<cref>[A-Z]+:[a-zA-Z0-9_.]+)\]");

        #region Write Node

        protected void WriteHyperlinkEnabledText(string text, TextWriter writer, DocItemWriterContext context)
        {
            int index = 0;
            while (true)
            {
                Match match = symbolRegex.Match(text, index);
                if (match.Success)
                {
                    writer.Write(text.Substring(index, match.Index - index));
                    index = match.Index + match.Value.Length;
                    string cref = match.Groups["cref"].Value;
                    WriteHyperlinkSymbol(cref, "", writer, context);
                }
                else
                {
                    break;
                }
            }
            writer.Write(text.Substring(index));
        }

        protected void WriteNode(XNode node, TextWriter writer, DocItemWriterContext context)
        {
            if (node is XText || node is XCData)
            {
                WriteHyperlinkEnabledText(node.ToString(), writer, context);
                return;
            }

            XElement element = node as XElement;
            if (element != null)
            {
                switch (element.Name.ToString())
                {
                    case "see":
                        {
                            string cref = element.Attribute("cref").Value;
                            string text = element.Value;
                            WriteHyperlinkSymbol(cref, text, writer, context);
                        }
                        return;
                }
            }

            throw new ArgumentException(string.Format("[{0}]: Don't know how to print {1}.", this.AssociatedDocItem.Name, node.GetType().Name));
        }

        protected void WriteNodes(IEnumerable<XNode> nodes, TextWriter writer, DocItemWriterContext context)
        {
            foreach (var node in nodes)
            {
                WriteNode(node, writer, context);
            }
        }

        #endregion

        #region Write Summary

        protected void WriteSummary(XElement memberElement, TextWriter writer, DocItemWriterContext context)
        {
            XElement summary = memberElement.Element("summary");
            if (summary != null)
            {
                WriteNodes(summary.Nodes(), writer, context);
            }
        }

        protected XElement WriteSummaryIfDocumentExists(XElement containerElement, TextWriter writer, DocItemWriterContext context)
        {
            XElement documentElement = containerElement.Element("document");
            if (documentElement != null)
            {
                XElement memberElement = documentElement.Element("member");
                if (memberElement != null)
                {
                    WriteSummary(memberElement, writer, context);
                    return memberElement;
                }
            }
            return null;
        }

        protected XElement WriteSummaryInDocItem(DocItem docItem, TextWriter writer, DocItemWriterContext context)
        {
            if (docItem.Document != null)
            {
                XElement member = docItem.Document.Element("member");
                if (member != null)
                {
                    WriteSummary(member, writer, context);
                    writer.WriteLine();
                    return member;
                }
            }
            return null;
        }

        #endregion

        #region Write Hyperlink

        protected string GetReadableName(DocItem item)
        {
            string name = item.Content.Attribute("name").Value;
            if (item.UniqueId.StartsWith("enum:"))
            {
                int index = item.Title.LastIndexOf(' ');
                return item.Title.Substring(0, index);
            }
            else
            {
                while (true)
                {
                    item = item.Parent;
                    if (item == null || !item.UniqueId.StartsWith("type:"))
                    {
                        break;
                    }
                    else
                    {
                        name = item.Content.Attribute("name").Value + "::" + name;
                    }
                }
            }
            return name;
        }

        protected void WriteHyperlinkPrimitiveType(string type, TextWriter writer, DocItemWriterContext context)
        {
            var docItem = context
                .MemberIdItemMap
                .Where(p => p.Key.StartsWith("T:"))
                .Where(p => p.Value.Content.Attribute("fullName").Value == type)
                .Select(p => p.Value)
                .FirstOrDefault();
            if (docItem == null)
            {
                context.UnknownPrimitiveTypes.Add(type);
                writer.Write(type);
            }
            else
            {
                writer.Write("/+linkid:{0}/{1}/-linkid/", docItem.UniqueId, GetReadableName(docItem));
            }
        }

        protected void WriteHyperlinkType(CppType type, TextWriter writer, DocItemWriterContext context)
        {
            switch (type.Decoration)
            {
                case CppDecoration.None:
                    {
                        WriteHyperlinkPrimitiveType(type.Name, writer, context);
                    }
                    break;
                case CppDecoration.Decoration:
                    {
                        WriteHyperlinkType(type.Arguments[0], writer, context);
                        writer.Write(" " + type.Name);
                    }
                    break;
                case CppDecoration.Template:
                    {
                        WriteHyperlinkPrimitiveType(type.Name, writer, context);
                        writer.Write("<");
                        for (int i = 0; i < type.Arguments.Length; i++)
                        {
                            WriteHyperlinkType(type.Arguments[i], writer, context);
                            if (i == type.Arguments.Length - 1)
                            {
                                writer.Write(">");
                            }
                            else
                            {
                                writer.Write(", ");
                            }
                        }
                    }
                    break;
                case CppDecoration.Function:
                    {
                        WriteHyperlinkPrimitiveType(type.Name, writer, context);
                        writer.Write(" " + type.CallingConversion + "(");
                        for (int i = 0; i < type.Arguments.Length; i++)
                        {
                            WriteHyperlinkType(type.Arguments[i], writer, context);
                            if (i == type.Arguments.Length - 1)
                            {
                                writer.Write(")");
                            }
                            else
                            {
                                writer.Write(", ");
                            }
                        }
                    }
                    break;
            }
        }

        protected void WriteHyperlinkType(string type, TextWriter writer, DocItemWriterContext context)
        {
            CppType cppType = CppType.Parse(type);
            WriteHyperlinkType(cppType, writer, context);
        }

        protected void WriteHyperlinkSymbol(string cref, string text, TextWriter writer, DocItemWriterContext context)
        {
            if (text != "")
            {
                writer.Write("/+linksymbol:{0}/{1}/-linksymbol/", cref, text);
            }
            else
            {
                DocItem docItem = null;
                if (!context.MemberIdItemMap.TryGetValue(cref, out docItem))
                {
                    if (cref.StartsWith("M:"))
                    {
                        var docItems = context
                            .MemberIdItemMap
                            .Where(p => p.Key.StartsWith(cref + "("))
                            .Select(p => p.Value)
                            .ToArray();
                        if (docItems.Length == 1)
                        {
                            docItem = docItems[0];
                        }
                    }
                }

                if (docItem != null)
                {
                    writer.Write("/+linksymbol:{0}/{1}/-linksymbol/", cref, GetReadableName(docItem));
                }
                else
                {
                    throw new ArgumentException(string.Format("[{0}]: Cannot generate hyperlink text for symbol {1}", this.AssociatedDocItem.Name, cref));
                }
            }
        }

        #endregion

        #region Write Table

        // describedTypedSubItems: name => tuple<XML, summary, inheritsFrom>[]
        protected void WriteTypedSubItemTable(Dictionary<string, Tuple<XElement, string, string>[]> describedTypedSubItems, string tableName, TextWriter writer, DocItemWriterContext context, bool writeType)
        {
            if (describedTypedSubItems.Count > 0)
            {
                writer.WriteLine("/+b/{0}:/-b//crlf/", tableName);
                writer.WriteLine("/+table/");
                if (writeType)
                {
                    writer.WriteLine("    /+rowheader//+col/Name/-col//+col/Type/-col//+col/Description/-col//-rowheader/");
                }
                else
                {
                    writer.WriteLine("    /+rowheader//+col/Name/-col//+col/Description/-col//-rowheader/");
                }
                foreach (var name in describedTypedSubItems.Keys.OrderBy(s => s))
                {
                    var memberElements = describedTypedSubItems[name];
                    foreach (var memberElement in memberElements)
                    {
                        writer.WriteLine("    /+row/");
                        writer.WriteLine("        /+col//+linksymbol:{0}/{1}/-linksymbol//-col/", memberElement.Item1.Attribute("name").Value, name);
                        if (writeType)
                        {
                            writer.Write("        /+col/");
                            WriteHyperlinkType(memberElement.Item2, writer, context);
                            writer.WriteLine("/-col/");
                        }
                        writer.Write("        /+col/");
                        WriteSummary(memberElement.Item1, writer, context);
                        if (memberElement.Item3 != null)
                        {
                            writer.Write(" (Inherits from ");
                            WriteHyperlinkType(memberElement.Item3, writer, context);
                            writer.Write(".)");
                        }
                        writer.WriteLine("/-col/");
                        writer.WriteLine("    /-row/");
                    }
                }
                writer.WriteLine("/-table//para/");
            }
        }

        // subItems: tuple<XML, inheritsFrom>[]
        protected void WriteTypedSubItemTable(Tuple<XElement, string>[] subItems, string tableName, TextWriter writer, DocItemWriterContext context)
        {
            var describedSubItems = subItems
                .GroupBy(x => x.Item1.Attribute("name").Value)
                .ToDictionary(
                    g => g.Key,
                    g => g.Select(x =>
                        Tuple.Create(
                            x.Item1.Element("document").Element("member"),
                            x.Item1.Element("type").Value,
                            x.Item2
                            )
                        ).ToArray()
                    );
            WriteTypedSubItemTable(describedSubItems, tableName, writer, context, true);
        }

        // describedSubItems: name => tuple<XML, inheritsFrom>[]
        protected void WriteSubItemTable(Dictionary<string, Tuple<XElement, string>[]> describedSubItems, string tableName, TextWriter writer, DocItemWriterContext context)
        {
            WriteTypedSubItemTable(
                describedSubItems
                    .ToDictionary(
                        p => p.Key,
                        p => p.Value.Select(v => Tuple.Create(v.Item1, null as string, v.Item2)).ToArray()
                        ),
                tableName,
                writer,
                context,
                false);
        }

        // describedSubItems: name => XML[]
        protected void WriteSubItemTable(Dictionary<string, XElement[]> describedSubItems, string tableName, TextWriter writer, DocItemWriterContext context)
        {
            WriteSubItemTable(
                describedSubItems
                    .ToDictionary(
                        p => p.Key,
                        p => p.Value
                            .Select(x => Tuple.Create(x, null as string))
                            .ToArray()
                        ),
                tableName,
                writer,
                context
                );
        }

        // subItems: tuple<XML, inheritsFrom>[]
        protected void WriteSubItemTable(Tuple<XElement, string>[] subItems, string tableName, TextWriter writer, DocItemWriterContext context)
        {
            var describedSubItems = subItems
                .GroupBy(x => x.Item1.Attribute("name").Value)
                .ToDictionary(
                    g => g.Key,
                    g => g.Select(x => Tuple.Create(x.Item1.Element("document").Element("member"), x.Item2)).ToArray()
                    );
            WriteSubItemTable(describedSubItems, tableName, writer, context);
        }

        // subItems: XML[]
        protected void WriteSubItemTable(XElement[] subItems, string tableName, TextWriter writer, DocItemWriterContext context)
        {
            WriteSubItemTable(subItems.Select(x => Tuple.Create(x, null as string)).ToArray(), tableName, writer, context);
        }

        #endregion
    }

    class NamespaceDocItemWriter : DocItemWriter
    {
        protected override void WriteContent(DocItem docItem, TextWriter writer, DocItemWriterContext context)
        {
            {
                var describedFunctions = docItem
                    .SubItems
                    .Where(i => i.UniqueId.StartsWith("function:"))
                    .Concat(docItem
                        .SubItems
                        .Where(i => i.UniqueId.StartsWith("functionGroup:"))
                        .SelectMany(i => i.SubItems)
                        )
                    .ToDictionary(
                        x => x.Content.Attribute("name").Value,
                        x => new XElement[] { x.Content.Element("document").Element("member") }
                        );
                WriteSubItemTable(describedFunctions, "Functions", writer, context);
            }
            {
                var describedTypes = docItem
                    .SubItems
                    .Where(i => i.UniqueId.StartsWith("type:"))
                    .Concat(docItem
                        .SubItems
                        .Where(i => i.UniqueId.StartsWith("enum:"))
                        )
                    .ToDictionary(
                        x =>
                        {
                            int index = x.Title.LastIndexOf(' ');
                            return x.Title.Substring(0, index).Trim();
                        },
                        x => new XElement[] { x.Content.Element("document").Element("member") }
                        );
                WriteSubItemTable(describedTypes, "Types", writer, context);
            }
        }
    }

    class EnumDocItemWriter : DocItemWriter
    {
        protected override void WriteContent(DocItem docItem, TextWriter writer, DocItemWriterContext context)
        {
            WriteSummaryInDocItem(docItem, writer, context);
            writer.WriteLine("/para/");
            writer.WriteLine("/+b/Members:/-b//crlf/");
            writer.WriteLine("/+table/");
            writer.WriteLine("    /+rowheader//+col/Name/-col//+col/Description/-col//-rowheader/");
            foreach (var fieldElement in docItem.Content.Elements("field"))
            {
                writer.WriteLine("    /+row/");
                string name = fieldElement.Attribute("name").Value;
                writer.WriteLine("        /+col/{0}/-col/", name);
                writer.Write("        /+col/");
                WriteSummaryIfDocumentExists(fieldElement, writer, context);
                writer.WriteLine("/-col/");
                writer.WriteLine("    /-row/");
            }
            writer.WriteLine("/-table//para/");
        }
    }

    class TypeDocItemWriter : DocItemWriter
    {
        private XElement[] GetBaseTypeElements(DocItem docItem)
        {
            return docItem.Content.Elements("baseType").ToArray();
        }

        private DocItem[] GetDirectAndIndirectBaseTypes(DocItem docItem, DocItemWriterContext context)
        {
            var baseTypeNames = GetBaseTypeElements(docItem)
                .Select(t => t.Attribute("fullName").Value)
                .ToArray();
            DocItem[] directBaseTypes = baseTypeNames
                .Where(t => context.UniqueIdItemMap.ContainsKey("type:" + t))
                .Select(t => context.UniqueIdItemMap["type:" + t])
                .ToArray();
            return directBaseTypes.Concat(directBaseTypes.SelectMany(t => GetDirectAndIndirectBaseTypes(t, context))).ToArray();
        }

        private XElement[] GetSubTypes(DocItem docItem)
        {
            return docItem.Content.Elements("enum").Concat(docItem.Content.Elements("type")).ToArray();
        }

        private XElement[] GetSubFields(DocItem docItem)
        {
            return docItem.Content.Elements("field").ToArray();
        }

        private XElement[] GetSubFunctions(DocItem docItem)
        {
            return docItem.Content.Elements("function")
                .Concat(
                    docItem.Content.Elements("functionGroup")
                        .SelectMany(e => e.Elements("function"))
                    )
                .ToArray();
        }

        protected override void WriteContent(DocItem docItem, TextWriter writer, DocItemWriterContext context)
        {
            WriteSummaryInDocItem(docItem, writer, context);
            writer.WriteLine("/para/");

            var baseTypes = docItem.Content.Elements("baseType").ToArray();
            if (baseTypes.Length > 0)
            {
                writer.WriteLine("/+b/Base Types:/-b//crlf/");
                foreach (var baseType in baseTypes)
                {
                    writer.Write("/nop/    ");
                    WriteHyperlinkType(baseType.Attribute("fullName").Value, writer, context);
                    writer.WriteLine("/crlf/");
                }
                writer.WriteLine("/para/");
            }

            DocItem[] baseTypeDocItems = GetDirectAndIndirectBaseTypes(docItem, context);
            var subTypes = GetSubTypes(docItem)
                .Select(x => Tuple.Create(x, null as string))
                .Concat(baseTypeDocItems
                    .SelectMany(d => GetSubTypes(d)
                        .Select(x => Tuple.Create(x, d.UniqueId.Substring(5))))
                    )
                .ToArray();
            var subFields = GetSubFields(docItem)
                .Select(x => Tuple.Create(x, null as string))
                .Concat(baseTypeDocItems
                    .SelectMany(d => GetSubFields(d)
                        .Select(x => Tuple.Create(x, d.UniqueId.Substring(5))))
                    )
                .ToArray();
            var subFunctions = GetSubFunctions(docItem)
                .Select(x => Tuple.Create(x, null as string))
                .Concat(baseTypeDocItems
                    .SelectMany(d => GetSubFunctions(d)
                        .Select(x => Tuple.Create(x, d.UniqueId.Substring(5))))
                    )
                .ToArray();
            WriteSubItemTable(subTypes, "Sub Types", writer, context);
            WriteTypedSubItemTable(subFields, "Fields", writer, context);
            WriteSubItemTable(subFunctions, "Member Functions", writer, context);
        }
    }

    class FunctionGroupDocItemWriter : DocItemWriter
    {
        protected override void WriteContent(DocItem docItem, TextWriter writer, DocItemWriterContext context)
        {
            XElement[] subFunctions = docItem.Content.Elements("function").ToArray();
            WriteSubItemTable(subFunctions, "Overloading Functions", writer, context);
        }
    }

    class FunctionDocItemWriter : DocItemWriter
    {
        protected override void WriteContent(DocItem docItem, TextWriter writer, DocItemWriterContext context)
        {
            XElement member = WriteSummaryInDocItem(docItem, writer, context);
            writer.WriteLine("/para/");
            string returnType = docItem.Content.Element("returnType").Value;
            XElement returnElement = member.Element("returns");
            var parameterTypes = docItem.Content.Elements("parameterType").Select(x => x.Value).ToArray();
            var parameters = docItem.Content.Elements("parameterPair")
                .ToDictionary(x => x.Attribute("name").Value, x => x.Value);
            var parameterElements = member.Elements("param").ToArray();
            foreach (var name in parameterElements.Select((x, i) => Tuple.Create(x.Attribute("name").Value, i)))
            {
                if (!parameters.ContainsKey(name.Item1))
                {
                    parameters.Add(name.Item1, parameterTypes[name.Item2]);
                }
            }

            writer.WriteLine("/+b/Signature:/-b//crlf/");
            writer.WriteLine("/+table/");
            writer.WriteLine("    /+rowheader//+col/Parameter or Return Value/-col//+col/Type/-col//+col/Description/-col//-rowheader/");
            {
                writer.WriteLine("    /+row/");
                writer.WriteLine("        /+col/return value/-col/");
                writer.Write("        /+col/");
                WriteHyperlinkType(returnType, writer, context);
                writer.WriteLine("/-col/");
                writer.Write("        /+col/");
                if (returnElement != null)
                {
                    WriteNodes(returnElement.Nodes(), writer, context);
                }
                writer.WriteLine("/-col/");
                writer.WriteLine("    /-row/");
            }
            foreach (var p in parameterElements)
            {
                string name = p.Attribute("name").Value;
                string type = parameters[name];
                var description = p.Nodes();

                writer.WriteLine("    /+row/");
                writer.WriteLine("        /+col/{0}/-col/", name);
                writer.Write("        /+col/");
                WriteHyperlinkType(type, writer, context);
                writer.WriteLine("/-col/");
                writer.Write("        /+col/");
                WriteNodes(description, writer, context);
                writer.WriteLine("/-col/");
                writer.WriteLine("    /-row/");
            }
            writer.WriteLine("/-table//para/");
        }
    }

    class FieldDocItemWriter : DocItemWriter
    {
        protected override void WriteContent(DocItem docItem, TextWriter writer, DocItemWriterContext context)
        {
            WriteSummaryInDocItem(docItem, writer, context);
            writer.WriteLine("/para//+b/Type:/-b//crlf/");
            WriteHyperlinkType(docItem.Content.Element("type").Value, writer, context);
            writer.WriteLine("/para/");
        }
    }
}
