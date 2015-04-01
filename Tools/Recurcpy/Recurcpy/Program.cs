using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.IO;

namespace Recurcpy
{
    class Program
    {
        static bool IncludeFilter(string filename, string[] extensions)
        {
            return extensions.Any(x => filename.EndsWith("." + x));
        }

        static bool ExceptFilter(string filename, string[] extensions)
        {
            return extensions.All(x => !filename.EndsWith("." + x));
        }

        static void Main(string[] args)
        {
            if (args.Length <= 2)
            {
                Console.WriteLine("Recurcpy.exe <src-path> <dst-path> include/except exp0 exp1 exp2 exp3 ...");
            }
            string sourcePath = Path.GetFullPath(args[0]);
            string destinationPath = Path.GetFullPath(args[1]);
            if (!sourcePath.EndsWith("\\")) sourcePath += "\\";
            if (!destinationPath.EndsWith("\\")) destinationPath += "\\";

            try
            {
                if (!Directory.Exists(sourcePath)) throw new Exception(string.Format("Source path \"{0}\" does not exists.", sourcePath));
                if (args[2] != "include" && args[2] != "except") throw new Exception("The third argument should be \"include\" or \"except\".");
                string[] extensions = args.Skip(3).ToArray();
                Func<string, bool> predicate = args[2] == "include"
                    ? new Func<string, bool>(x => IncludeFilter(x, extensions))
                    : new Func<string, bool>(x => ExceptFilter(x, extensions));
                string[] files = Directory.GetFiles(sourcePath, "*", SearchOption.AllDirectories)
                    .Where(predicate)
                    .Select(x => x.Substring(sourcePath.Length))
                    .ToArray();

                foreach (var file in files)
                {
                    string sourceFile = sourcePath + file;
                    string destinationFile = destinationPath + file;
                    Directory.CreateDirectory(Path.GetDirectoryName(destinationFile));
                    File.Copy(sourceFile, destinationFile, true);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
            }
        }
    }
}
