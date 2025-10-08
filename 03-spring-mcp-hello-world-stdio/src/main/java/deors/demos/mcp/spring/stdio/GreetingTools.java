package deors.demos.mcp.spring.stdio;

import java.util.logging.Logger;

import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.stereotype.Component;

@Component
public class GreetingTools {

    @Tool(name = "greetPerson", description = "Greets a person by name")
    public String greetPerson(
            @ToolParam(description = "The name of the person to greet") String name) {
        String response = "Hello, %s!".formatted(name);
        Logger.getLogger(GreetingTools.class.getName()).info("Person will be greeted with this message: %s".formatted(response));
        return response;
    }

    @Tool(name = "greetAudience", description = "Greets the audience of an event, specifying event name and location")
    public String greetAudience(
            @ToolParam(description = "The name of the event") String event,
            @ToolParam(description = "The location of the event") String location) {
        String response = "Hello to everyone at the %s event in %s!".formatted(event, location);
        Logger.getLogger(GreetingTools.class.getName()).info("Audience will be greeted with this message: %s".formatted(response));
        return response;
    }
}
