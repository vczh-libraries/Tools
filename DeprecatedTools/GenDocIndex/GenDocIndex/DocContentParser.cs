using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace GenDocIndex
{
    enum DocEntityType
    {
        // begin and end
        Bold,
        Header1,
        Header2,
        Header3,
        LinkId,
        LinkSymbol,
        Table,
        RowHeader,
        Row,
        Col,
        Code,

        // solid
        Slash,
        Crlf,
        Para,
        Nop,
        Img,
        Color,
        Text,
    }

    enum DocEntityState
    {
        Open,
        Close,
        Solid,
    }

    class DocEntity
    {
        public DocEntityType Type { get; set; }
        public DocEntityState State { get; set; }
        public string Argument { get; set; }

        public override string ToString()
        {
            if (this.Type == DocEntityType.Text)
            {
                return this.Argument;
            }
            else
            {
                string name =
                    this.State == DocEntityState.Open ? "+" + this.Type.ToString() :
                    this.State == DocEntityState.Close ? "-" + this.Type.ToString() :
                    this.Type.ToString();
                if (Argument == "")
                {
                    return string.Format("/{0}/", name);
                }
                else
                {
                    return string.Format("/{0}:\"{1}\"/", name, this.Argument);
                }
            }
        }
    }

    class DocNode
    {
        public List<DocEntity> Entities { get; private set; }

        public DocNode()
        {
            this.Entities = new List<DocEntity>();
        }
    }

    static class DocContentParser
    {
        enum ParseState
        {
            Text,
            Slash,
            SlashName,
            WaitingForParam,
            InParamQuot,
            OutParamQuot,
            InParam,
        }

        static DocEntity CreateEmptyTextEntity()
        {
            return new DocEntity
            {
                Type = DocEntityType.Text,
                State = DocEntityState.Solid,
                Argument = "",
            };
        }

        static DocEntity CopyAndReset(ref DocEntity entity)
        {
            DocEntity result = new DocEntity
            {
                Type = entity.Type,
                State = entity.State,
                Argument = entity.Argument,
            };
            entity = CreateEmptyTextEntity();
            return result;
        }

        static DocEntityType GetType(string name)
        {
            switch (name)
            {
                case "b": return DocEntityType.Bold;
                case "h1": return DocEntityType.Header1;
                case "h2": return DocEntityType.Header2;
                case "h3": return DocEntityType.Header3;
                case "linkid": return DocEntityType.LinkId;
                case "linksymbol": return DocEntityType.LinkSymbol;
                case "table": return DocEntityType.Table;
                case "rowheader": return DocEntityType.RowHeader;
                case "row": return DocEntityType.Row;
                case "col": return DocEntityType.Col;
                case "": return DocEntityType.Slash;
                case "crlf": return DocEntityType.Crlf;
                case "para": return DocEntityType.Para;
                case "nop": return DocEntityType.Nop;
                case "img": return DocEntityType.Img;
                case "color": return DocEntityType.Color;
                default: throw new ArgumentException(string.Format("Don't know tab name {0}.", name));
            }
        }

        static IEnumerable<DocEntity> ParseLine(string line)
        {
            if (line.StartsWith("/codebegin:"))
            {
                yield return new DocEntity
                {
                    Type = DocEntityType.Code,
                    State = DocEntityState.Close,
                    Argument = line.Substring("/codebegin:".Length),
                };
            }
            else if (line == "/codeend")
            {
                yield return new DocEntity
                {
                    Type = DocEntityType.Code,
                    State = DocEntityState.Close,
                    Argument = "",
                };
            }
            else
            {
                ParseState state = ParseState.Text;
                DocEntity entity = CreateEmptyTextEntity();
                foreach (char c in line)
                {
                    switch (state)
                    {
                        case ParseState.Text:
                            {
                                if (c == '/')
                                {
                                    if (entity.Argument != "")
                                    {
                                        yield return CopyAndReset(ref entity);
                                    }
                                    state = ParseState.Slash;
                                }
                                else
                                {
                                    entity.Argument += c;
                                }
                            }
                            break;
                        case ParseState.Slash:
                            {
                                switch (c)
                                {
                                    case '+':
                                        entity.State = DocEntityState.Open;
                                        state = ParseState.SlashName;
                                        break;
                                    case '-':
                                        entity.State = DocEntityState.Close;
                                        state = ParseState.SlashName;
                                        break;
                                    default:
                                        entity.Argument += c;
                                        state = ParseState.SlashName;
                                        break;
                                }
                            }
                            break;
                        case ParseState.SlashName:
                            {
                                switch (c)
                                {
                                    case '/':
                                        entity.Type = GetType(entity.Argument);
                                        entity.Argument = "";
                                        yield return CopyAndReset(ref entity);
                                        state = ParseState.Text;
                                        break;
                                    case ':':
                                        entity.Type = GetType(entity.Argument);
                                        entity.Argument = "";
                                        state = ParseState.WaitingForParam;
                                        break;
                                    default:
                                        entity.Argument += c;
                                        break;
                                }
                            }
                            break;
                        case ParseState.WaitingForParam:
                            {
                                switch (c)
                                {
                                    case '/':
                                        yield return CopyAndReset(ref entity);
                                        state = ParseState.Text;
                                        break;
                                    case '"':
                                        state = ParseState.InParamQuot;
                                        break;
                                    default:
                                        entity.Argument += c;
                                        state = ParseState.InParam;
                                        break;
                                }
                            }
                            break;
                        case ParseState.InParamQuot:
                            {
                                switch (c)
                                {
                                    case '"':
                                        state = ParseState.OutParamQuot;
                                        break;
                                    default:
                                        entity.Argument += c;
                                        break;
                                }
                            }
                            break;
                        case ParseState.OutParamQuot:
                            {
                                switch (c)
                                {
                                    case '/':
                                        yield return CopyAndReset(ref entity);
                                        state = ParseState.Text;
                                        break;
                                    default:
                                        throw new ArgumentException("'/' expected after quot argument。");
                                }
                            }
                            break;
                        case ParseState.InParam:
                            {
                                switch (c)
                                {
                                    case '/':
                                        yield return CopyAndReset(ref entity);
                                        state = ParseState.Text;
                                        break;
                                    default:
                                        entity.Argument += c;
                                        break;
                                }
                            }
                            break;
                    }
                }
                if (entity.Type == DocEntityType.Text && entity.Argument != "")
                {
                    yield return entity;
                }
            }
        }

        public static DocNode Parse(List<string> contentLines, List<string> errorLines)
        {
            DocNode node = new DocNode();
            foreach (var line in contentLines)
            {
                try
                {
                    node.Entities.AddRange(ParseLine(line));
                }
                catch (ArgumentException ex)
                {
                    errorLines.Add(string.Format("in \"{0}\", {1}", line, ex.Message));
                }
            }
            return node;
        }
    }
}
