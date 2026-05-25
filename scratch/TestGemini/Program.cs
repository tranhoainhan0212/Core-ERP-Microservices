using System;
using System.Net.Http;
using System.Threading.Tasks;

class Program {
    static async Task Main() {
        var client = new HttpClient();
        client.DefaultRequestHeaders.Add("Authorization", "Bearer AIzaSyCvyrIZjRko3hw81VMHl2nEq2RYEAxLZLg");
        var content = new StringContent("{\"model\": \"gemini-2.0-flash\", \"messages\": [{\"role\": \"user\", \"content\": \"Hello\"}]}", System.Text.Encoding.UTF8, "application/json");
        var response = await client.PostAsync("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", content);
        Console.WriteLine($"Status: {response.StatusCode}");
        Console.WriteLine(await response.Content.ReadAsStringAsync());
    }
}
