# Contributing to Solana Trading Bots

Thank you for your interest in contributing! This project welcomes contributions from the community.

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in Issues
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (OS, Rust version, etc.)
   - Relevant logs or error messages

### Suggesting Features

1. Check if the feature has been requested
2. Create a new issue describing:
   - The problem it solves
   - Proposed implementation
   - Alternatives considered
   - Why it would be valuable

### Submitting Code

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Follow Rust best practices
   - Add tests for new functionality
   - Update documentation
   - Ensure code compiles without warnings

4. **Test your changes**
   ```bash
   cargo test
   cargo clippy
   cargo fmt
   ```

5. **Commit your changes**
   ```bash
   git commit -m "feat: add new feature"
   ```
   Use conventional commit messages:
   - `feat:` new feature
   - `fix:` bug fix
   - `docs:` documentation
   - `refactor:` code refactoring
   - `test:` adding tests
   - `chore:` maintenance

6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create a Pull Request**
   - Describe what changed and why
   - Reference related issues
   - Ensure CI passes

## Code Standards

### Rust Style

- Use `rustfmt` for formatting
- Use `clippy` for linting
- Follow Rust naming conventions
- Add doc comments for public APIs

### Documentation

- Update README.md if behavior changes
- Add inline comments for complex logic
- Update GUIDE.md for user-facing changes
- Include examples in doc comments

### Testing

- Write unit tests for new functions
- Add integration tests for features
- Test error cases
- Aim for >70% coverage

### Security

- **NEVER commit private keys or wallets**
- Validate all external inputs
- Use secure random number generation
- Follow cryptography best practices
- Report security issues privately

## Development Setup

```bash
# Clone repo
git clone https://github.com/yourusername/solana-trading-bots
cd solana-trading-bots

# Install dependencies
cargo build

# Run tests
cargo test

# Run specific bot
cd sandwich-bot
cargo run -- --dry-run
```

## Architecture Guidelines

### Adding a New Bot

1. Create new directory: `new-bot/`
2. Add to workspace in root `Cargo.toml`
3. Follow structure of existing bots:
   ```
   new-bot/
   ├── Cargo.toml
   ├── src/
   │   ├── main.rs
   │   ├── lib.rs
   │   ├── bot.rs
   │   ├── config.rs
   │   └── ...
   ├── config.example.toml
   ├── README.md
   ├── GUIDE.md
   └── tests/
   ```

### Adding Protocol Support

1. Create module in `protocols/`
2. Implement `ProtocolHandler` trait
3. Add configuration options
4. Write tests
5. Document usage

### Performance Considerations

- Minimize allocations in hot paths
- Use async/await efficiently
- Batch RPC calls when possible
- Cache frequently accessed data
- Profile before optimizing

## Community Guidelines

### Code of Conduct

- Be respectful and professional
- Welcome newcomers
- Give constructive feedback
- Focus on ideas, not people
- No harassment or discrimination

### Communication

- Use GitHub Issues for bugs/features
- Use Discussions for questions
- Join Discord/Telegram for chat
- Be patient with responses

### Ethics

- Consider impact on DeFi ecosystem
- Don't promote harmful behavior
- Disclose risks and limitations
- Prioritize user safety
- Be transparent about trade-offs

## Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Credited in documentation

Thank you for contributing! 🚀

