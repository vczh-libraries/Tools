using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.IO;
using System.Web;

namespace GenDocIndex
{
    static class StaticHtmlDocGenerator
    {
        static string GetFileName(DocItem docItem, string outputFolder = "")
        {
            return outputFolder + docItem.UniqueId.Replace(':', '_').Replace('.', '_') + ".html";
        }

        static void GenerateText(TextWriter writer, string content)
        {
            HttpUtility.HtmlEncode(content, writer);
        }

        static void GenerateIndexTree(TextWriter writer, IEnumerable<DocItem> docItemSiblings, List<DocItem> parentList, int parentIndex, int level)
        {
            foreach (var sibling in docItemSiblings.OrderBy(d => d.Title))
            {
                bool needHyperlink =
                    !(
                        parentIndex < parentList.Count &&
                        sibling == parentList[parentIndex] &&
                        parentIndex == parentList.Count - 1
                    );
                writer.Write("<nobr>");
                for (int i = 0; i < level; i++)
                {
                    writer.Write("&nbsp;&nbsp;&nbsp;&nbsp;");
                }
                if (needHyperlink)
                {
                    writer.Write("<a href=\"{0}\">", GetFileName(sibling));
                }
                else
                {
                    writer.Write("<b>");
                }
                GenerateText(writer, sibling.Title);
                if (needHyperlink)
                {
                    writer.Write("</a>");
                }
                else
                {
                    writer.Write("</b>");
                }
                writer.Write("</nobr><br/>");
                if (parentIndex < parentList.Count && sibling == parentList[parentIndex])
                {
                    GenerateIndexTree(writer, sibling.SubItems, parentList, parentIndex + 1, level + 1);
                }
            }
        }

        public static void GenerateDocumentContent(TextWriter writer, DocItem docItem, DocItemValidationResult validationResult, Func<DocItem, string> linkTransformer)
        {
            string currentColor = "000000";
            writer.Write("<p><font color=\"{0}\">", currentColor);
            foreach (var docEntity in docItem.Content.Entities)
            {
                switch (docEntity.Type)
                {
                    case DocEntityType.Bold:
                        switch (docEntity.State)
                        {
                            case DocEntityState.Open:
                                writer.Write("<b>");
                                break;
                            case DocEntityState.Close:
                                writer.Write("</b>");
                                break;
                        }
                        break;
                    case DocEntityType.Header1:
                        switch (docEntity.State)
                        {
                            case DocEntityState.Open:
                                writer.Write("<h1>");
                                break;
                            case DocEntityState.Close:
                                writer.Write("</h1>");
                                break;
                        }
                        break;
                    case DocEntityType.Header2:
                        switch (docEntity.State)
                        {
                            case DocEntityState.Open:
                                writer.Write("<h2>");
                                break;
                            case DocEntityState.Close:
                                writer.Write("</h2>");
                                break;
                        }
                        break;
                    case DocEntityType.Header3:
                        switch (docEntity.State)
                        {
                            case DocEntityState.Open:
                                writer.Write("<h3>");
                                break;
                            case DocEntityState.Close:
                                writer.Write("</h3>");
                                break;
                        }
                        break;
                    case DocEntityType.LinkId:
                        switch (docEntity.State)
                        {
                            case DocEntityState.Open:
                                writer.Write("<a href=\"{0}\">", linkTransformer(validationResult.UniqueIdItemMap[docEntity.Argument]));
                                break;
                            case DocEntityState.Close:
                                writer.Write("</a>");
                                break;
                        }
                        break;
                    case DocEntityType.LinkSymbol:
                        switch (docEntity.State)
                        {
                            case DocEntityState.Open:
                                writer.Write("<a href=\"{0}\">", linkTransformer(validationResult.MemberIdItemMap[docEntity.Argument]));
                                break;
                            case DocEntityState.Close:
                                writer.Write("</a>");
                                break;
                        }
                        break;
                    case DocEntityType.Table:
                        switch (docEntity.State)
                        {
                            case DocEntityState.Open:
                                writer.Write("<div  class=\"docTable\"><table>");
                                break;
                            case DocEntityState.Close:
                                writer.Write("</table></div>");
                                break;
                        }
                        break;
                    case DocEntityType.RowHeader:
                        switch (docEntity.State)
                        {
                            case DocEntityState.Open:
                                writer.Write("<thead><tr>");
                                break;
                            case DocEntityState.Close:
                                writer.Write("</tr></thead>");
                                break;
                        }
                        break;
                    case DocEntityType.Row:
                        switch (docEntity.State)
                        {
                            case DocEntityState.Open:
                                writer.Write("<tr>");
                                break;
                            case DocEntityState.Close:
                                writer.Write("</tr>");
                                break;
                        }
                        break;
                    case DocEntityType.Col:
                        switch (docEntity.State)
                        {
                            case DocEntityState.Open:
                                writer.Write("<td>");
                                break;
                            case DocEntityState.Close:
                                writer.Write("</td>");
                                break;
                        }
                        break;
                    case DocEntityType.Code:
                        writer.Write("<table><tr><td>");
                        GenerateText(writer, docEntity.Argument);
                        writer.Write("</td></tr></table>");
                        break;
                    case DocEntityType.Slash:
                        GenerateText(writer, "/");
                        break;
                    case DocEntityType.Crlf:
                        writer.Write("<br/>");
                        break;
                    case DocEntityType.Para:
                        writer.Write("</font></p><p><font color=\"{0}\">", currentColor);
                        break;
                    case DocEntityType.Nop:
                        break;
                    case DocEntityType.Img:
                        writer.Write("<img src=\"{0}\"/>", docEntity.Argument);
                        break;
                    case DocEntityType.Color:
                        currentColor = docEntity.Argument;
                        writer.Write("</font><font color=\"{0}\">", currentColor);
                        break;
                    case DocEntityType.Text:
                        GenerateText(writer, docEntity.Argument);
                        break;
                }
            }
            writer.Write("</font></p>");
        }

        static void GenerateContent(TextWriter writer, DocItem docItem, DocItemValidationResult validationResult)
        {
            writer.WriteLine("<table width=\"100%\"><col width=\"10%\"/><col width=\"90%\"/>");
            writer.WriteLine("<tr><td class=\"NavigateHeader\" colspan=\"2\" align=\"left\">");
            writer.WriteLine("<a class=\"LogoLink\" href=\"reference_gacui.html\"><img src=\"../Content/GacLib_LogoAndTitle.gif\" alt=\"GacLib -- GPU Accelerated C++ User Interface\"/></a>");
            writer.WriteLine("</td></tr>");
            writer.WriteLine("<tr><td class=\"frameTable indexPanel\" valign=\"top\">");
            {
                List<DocItem> parentList = new List<DocItem>();
                {
                    DocItem currentItem = docItem;
                    while (currentItem != null)
                    {
                        parentList.Insert(0, currentItem);
                        currentItem = currentItem.Parent;
                    }
                }
                GenerateIndexTree(writer, validationResult.RootItems, parentList, 0, 0);
            }
            writer.WriteLine("</td><td class=\"frameTable contentPanel\" valign=\"top\">");
            {
                GenerateDocumentContent(writer, docItem, validationResult, d => Path.GetFileName(GetFileName(d)));
            }
            writer.WriteLine("</td></tr></table>");
        }

        static void GenerateFile(DocItem docItem, string outputFolder, DocItemValidationResult validationResult)
        {
            string fileName = GetFileName(docItem, outputFolder);
            using (StreamWriter writer = new StreamWriter(new FileStream(fileName, FileMode.Create, FileAccess.Write), Encoding.UTF8))
            {
                writer.WriteLine("<html>");
                writer.WriteLine("<head>");
                writer.WriteLine("<meta http-equiv=\"X-UA-Compatible\" content=\"IE=8\" />");
                writer.WriteLine("<link rel=\"Stylesheet\" type=\"text/css\" href=\"../Content/DocStyle.css\" />");
                writer.WriteLine("<link rel=\"Stylesheet\" type=\"text/css\" href=\"../Content/PageStyle.css\" />");
                writer.WriteLine("<title>{0}</title>", docItem.Title);
                writer.WriteLine("</head>");
                writer.WriteLine("<body>");
                GenerateContent(writer, docItem, validationResult);
                writer.WriteLine("</body>");
                writer.WriteLine("</html>");
            }
            GenerateFiles(docItem.SubItems, outputFolder, validationResult);
        }

        static void GenerateFiles(IEnumerable<DocItem> docItems, string outputFolder, DocItemValidationResult validationResult)
        {
            foreach (var item in docItems.OrderBy(i => i.Title))
            {
                GenerateFile(item, outputFolder, validationResult);
            }
        }

        public static void GenerateStaticHtmlDocument(string outputFolder, DocItemValidationResult validationResult)
        {
            GenerateFiles(validationResult.RootItems, outputFolder, validationResult);
        }
    }
}
