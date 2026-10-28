const { withPodfile } = require('@expo/config-plugins');

const MARKER = '# GachiGacha: preserve UTF-8 paths from Node in CocoaPods';
const PATCH = `${MARKER}
module Pod::Executable
  class << self
    alias_method :execute_command_without_utf8_paths, :execute_command

    def execute_command(command, *args, **kwargs)
      output = execute_command_without_utf8_paths(command, *args, **kwargs)
      return output unless command == 'node' && output.encoding == Encoding::BINARY

      utf8_output = output.dup.force_encoding(Encoding::UTF_8)
      utf8_output.valid_encoding? ? utf8_output : output
    end
  end
end
`;

module.exports = function withPodfileUtf8Paths(config) {
  return withPodfile(config, (updatedConfig) => {
    const podfile = updatedConfig.modResults.contents;
    if (!podfile.includes(MARKER)) {
      updatedConfig.modResults.contents = `${PATCH}\n${podfile}`;
    }
    return updatedConfig;
  });
};
