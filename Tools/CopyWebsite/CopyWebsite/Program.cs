using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Net;
using System.IO;
using System.Web;

namespace CopyWebsite
{
    class Program
    {
        const int PLANTEXT = 0;
        const int WAITFORTAGNAME = 1;
        const int TAGNAME = 2;
        const int WAITFORATTNAME = 3;
        const int ATTNAME = 4;
        const int WAITFORQUOT = 5;
        const int ATTVALUE = 6;
        const int ATTVALUENOQUOT = 7;

        static bool IsName(char c)
        {
            return 'a' <= c && c <= 'z' || 'A' <= c && c <= 'Z' || '0' <= c && c <= '9' || c == '_' || c == '-';
        }

        static void SearchForUrls(string rootUrl, string url, string text, List<string> urls, HashSet<string> urlsHash)
        {
            /*
             * abc< link    href="x.html"   alt=hi>text</a>
             * 00011222233334444566666663333444577000001120
             */
            int state = 0;
            int oldState = 0;
            string tagName = "";
            string attName = "";
            string attValue = "";
            foreach (var c in text)
            {
                oldState = state;
                switch (state)
                {
                    case PLANTEXT:
                        if (c == '<')
                        {
                            state = WAITFORTAGNAME;
                        }
                        break;
                    case WAITFORTAGNAME:
                        if (IsName(c))
                        {
                            tagName = new string(new char[] { c });
                            state = TAGNAME;
                        }
                        break;
                    case TAGNAME:
                        if (IsName(c))
                        {
                            tagName += c;
                        }
                        else if (c == '>')
                        {
                            state = PLANTEXT;
                        }
                        else
                        {
                            state = WAITFORATTNAME;
                        }
                        break;
                    case WAITFORATTNAME:
                        if (IsName(c))
                        {
                            attName = new string(new char[] { c });
                            state = ATTNAME;
                        }
                        else if (c == '>')
                        {
                            state = PLANTEXT;
                        }
                        break;
                    case ATTNAME:
                        if (IsName(c))
                        {
                            attName += c;
                        }
                        else if (c == '>')
                        {
                            state = PLANTEXT;
                        }
                        else if (c == ' ' || c == '=')
                        {
                            attValue = "";
                            state = WAITFORQUOT;
                        }
                        else if (c != '/')
                        {
                            attValue = new string(new char[] { c });
                            state = ATTVALUENOQUOT;
                        }
                        break;
                    case WAITFORQUOT:
                        if (c == '"')
                        {
                            state = ATTVALUE;
                        }
                        else if (c == '>')
                        {
                            state = PLANTEXT;
                        }
                        break;
                    case ATTVALUE:
                        if (c == '"')
                        {
                            state = WAITFORATTNAME;
                        }
                        else
                        {
                            attValue += c;
                        }
                        break;
                    case ATTVALUENOQUOT:
                        if (c == '>')
                        {
                            state = PLANTEXT;
                        }
                        else if (c == '/' || c == ' ')
                        {
                            state = WAITFORATTNAME;
                        }
                        else
                        {
                            attValue += c;
                        }
                        break;
                }
                if ((oldState == ATTVALUE || oldState == ATTVALUENOQUOT) && state != oldState)
                {
                    bool collect = false;
                    if (tagName == "link" && attName == "href")
                    {
                        collect = true;
                    }
                    else if (tagName == "a" && attName == "href")
                    {
                        collect = true;
                    }
                    else if (tagName == "img" && attName == "src")
                    {
                        collect = true;
                    }
                    else if (tagName == "script" && attName == "src")
                    {
                        collect = true;
                    }

                    if (collect)
                    {
                        if (!attValue.Contains("://"))
                        {
                            int sharp = attValue.IndexOf('#');
                            if (sharp != -1)
                            {
                                attValue = attValue.Substring(0, sharp);
                            }
                            if (!attValue.StartsWith("/"))
                            {
                                attValue = url.Substring(0, url.LastIndexOf('/') + 1) + attValue;
                            }
                            attValue = Uri.UnescapeDataString(attValue);
                            if (urlsHash.Add(attValue.ToUpper()))
                            {
                                urls.Add(attValue);
                            }
                        }
                    }
                }
            }
        }

        static void Main(string[] args)
        {
            if (args.Length != 3)
            {
                Console.WriteLine("Codepack.exe <url> <rootDefaultFileName> <path>");
                return;
            }

            List<string> relativeUrls = new List<string>() { "/" };
            HashSet<string> relativeUrlsHash = new HashSet<string>();
            HashSet<string> writtenFiles = new HashSet<string>();
            HashSet<string> deadUrls = new HashSet<string>();
            int currentUrlIndex = 0;

            string rootUrl = args[0];
            string defaultFileName = args[1];
            string outputPath = Path.GetFullPath(args[2]);
            if (outputPath.Last() == '\\')
            {
                outputPath.Substring(0, outputPath.Length - 1);
            }

            Console.WriteLine("Root Url: {0}", rootUrl);
            Console.WriteLine("Default File Name: {0}", defaultFileName);
            Console.WriteLine("Output Directory: {0}", outputPath);

            while (currentUrlIndex < relativeUrls.Count)
            {
                string url = relativeUrls[currentUrlIndex++];
                if (url.Length == 0 || url[0] != '/')
                {
                    url = '/' + url;
                }

                string file = Path.GetFullPath(outputPath + url.Replace('/', '\\'));
                Directory.CreateDirectory(Path.GetDirectoryName(file));
                if (file == outputPath + "\\")
                {
                    file += defaultFileName;
                }

                Console.Write("{0}/{1}/{2} ", writtenFiles.Count, currentUrlIndex + 1, relativeUrls.Count);
                if (!writtenFiles.Add(file.ToUpper()))
                {
                    Console.WriteLine("Url \"{0}\" has been downloaded.", url);
                }
                else
                {
                    Console.WriteLine("Downloading \"{0}\"...", url);
                    HttpWebRequest request = (HttpWebRequest)WebRequest.Create(rootUrl + url);
                    request.Method = "GET";
                    try
                    {
                        HttpWebResponse response = (HttpWebResponse)request.GetResponse();
                        if (response.StatusCode != HttpStatusCode.OK)
                        {
                            Console.WriteLine("This web page cannot be found.");
                        }
                        else
                        {
                            if (!file.StartsWith(outputPath))
                            {
                                Console.WriteLine("This file cannot be downloaded into the specified output directory.");
                            }
                            else
                            {
                                Console.WriteLine("Writing to \"{0}\"...", file.Substring(outputPath.Length));

                                List<byte[]> buffers = new List<byte[]>();
                                using (Stream stream = response.GetResponseStream())
                                {
                                    while (true)
                                    {
                                        int size = 65536;
                                        byte[] buffer = new byte[size];
                                        int read = stream.Read(buffer, 0, size);
                                        if (read <= 0)
                                        {
                                            break;
                                        }
                                        else if (read == size)
                                        {
                                            buffers.Add(buffer);
                                        }
                                        else
                                        {
                                            byte[] readBuffer = new byte[read];
                                            Array.Copy(buffer, readBuffer, read);
                                            buffers.Add(readBuffer);
                                        }
                                    }
                                }

                                byte[] fullBuffer = new byte[buffers.Select(b => b.Length).Sum()];
                                int offset = 0;
                                foreach (var buffer in buffers)
                                {
                                    Array.Copy(buffer, 0, fullBuffer, offset, buffer.Length);
                                    offset += buffer.Length;
                                }

                                using (Stream stream = new FileStream(file, FileMode.Create, FileAccess.Write))
                                {
                                    stream.Write(fullBuffer, 0, fullBuffer.Length);
                                }

                                switch (Path.GetExtension(file).ToUpper())
                                {
                                    case ".HTML":
                                    case ".HTM":
                                        using (StreamReader reader = new StreamReader(new MemoryStream(fullBuffer, false), Encoding.UTF8, true))
                                        {
                                            string text = reader.ReadToEnd();
                                            SearchForUrls(rootUrl, url, text, relativeUrls, relativeUrlsHash);
                                        }
                                        break;
                                }
                            }
                        }
                        response.Close();
                    }
                    catch (WebException)
                    {
                        deadUrls.Add(url);
                    }
                }
            }

            Console.WriteLine("========================FINISHED================================");
            Console.WriteLine("The following urls are failed to download:");
            using (StreamWriter writer = new StreamWriter(outputPath + "\\DeadUrls.txt"))
            {
                foreach (var url in deadUrls)
                {
                    Console.WriteLine(url);
                    writer.WriteLine(url);
                }
            }
        }
    }
}
