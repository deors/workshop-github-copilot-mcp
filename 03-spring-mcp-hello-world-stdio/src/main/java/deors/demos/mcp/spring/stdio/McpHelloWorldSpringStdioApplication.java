package deors.demos.mcp.spring.stdio;

import java.util.logging.Logger;

import org.springframework.ai.tool.ToolCallbackProvider;
import org.springframework.ai.tool.method.MethodToolCallbackProvider;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class McpHelloWorldSpringStdioApplication {

	public static void main(String[] args) {
		SpringApplication.run(McpHelloWorldSpringStdioApplication.class, args);
	}

	@Bean
	public ToolCallbackProvider toolCallbackProvider(GreetingTools greetingTools) {
		return MethodToolCallbackProvider.builder()
			.toolObjects(greetingTools)
			.build();
	}
}
