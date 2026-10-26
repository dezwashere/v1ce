Pod::Spec.new do |s|
  s.name = 'V1CECoinRenderer'
  s.version = '1.0.0'
  s.summary = 'Native SceneKit renderer for V1CE coin assets'
  s.description = 'Local Expo module that renders personalized V1CE coins with SceneKit.'
  s.author = 'Dez'
  s.homepage = 'https://github.com/dezwashere/v1ce'
  s.license = { :type => 'Proprietary', :text => 'Internal application code.' }
  s.source = { :git => 'https://github.com/dezwashere/v1ce.git' }
  s.platform = :ios, '16.4'
  s.swift_version = '5.9'
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.frameworks = 'Foundation', 'Metal', 'SceneKit', 'UIKit', 'WidgetKit'
  s.source_files = '**/*.{h,m,mm,swift}'
  s.resources = 'Assets/V1CECoinMaster/1.0.0/*'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }
end