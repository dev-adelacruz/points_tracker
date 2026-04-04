# frozen_string_literal: true

require "swagger_helper"

RSpec.describe "Host::Performances" do
  let(:json_response) { JSON.parse(response.body, symbolize_names: true) }
  let(:host) { create(:user, :host) }
  let(:other_host) { create(:user, :host) }
  let(:emcee) { create(:user, :emcee) }
  let(:team) { create(:team) }
  let(:session) { create(:session, team: team, created_by: emcee, date: Date.current) }

  before do
    create(:team_membership, user: host, team: team)
  end

  describe "#show" do
    path "/api/v1/host/performance" do
      get "returns the current host's session history for a date range" do
        tags "Host::Performances"
        produces "application/json"
        parameter name: :start_date, in: :query, type: :string, required: true
        parameter name: :end_date, in: :query, type: :string, required: true

        response(200, "returns sessions and coin totals for the period") do
          let(:start_date) { Date.current.beginning_of_month.to_s }
          let(:end_date) { Date.current.to_s }

          before do
            create(:coin_entry, session: session, user: host, coins: 40_000)
            sign_in host
          end

          run_test! do
            expect(response).to have_http_status :ok
            data = json_response[:data]
            expect(data[:host_id]).to eq(host.id)
            expect(data[:monthly_total]).to eq(40_000)
            expect(data[:sessions].length).to eq(1)
            expect(data[:sessions].first[:coins]).to eq(40_000)
            expect(data[:sessions].first[:attended]).to be(true)
            expect(data).to have_key(:daily_totals)
            expect(data).to have_key(:weekly_totals)
          end
        end

        response(200, "marks unattended sessions as absent") do
          let(:start_date) { Date.current.beginning_of_month.to_s }
          let(:end_date) { Date.current.to_s }

          before do
            # session exists but host has no coin entry
            session
            sign_in host
          end

          run_test! do
            expect(response).to have_http_status :ok
            data = json_response[:data]
            expect(data[:monthly_total]).to eq(0)
            expect(data[:sessions].first[:attended]).to be(false)
          end
        end

        response(200, "only shows own coin entries, not other hosts") do
          let(:start_date) { Date.current.beginning_of_month.to_s }
          let(:end_date) { Date.current.to_s }

          before do
            create(:team_membership, user: other_host, team: team)
            create(:coin_entry, session: session, user: other_host, coins: 50_000)
            sign_in host
          end

          run_test! do
            expect(response).to have_http_status :ok
            data = json_response[:data]
            expect(data[:monthly_total]).to eq(0)
          end
        end

        response(422, "returns unprocessable entity when date params are missing") do
          let(:start_date) { nil }
          let(:end_date) { nil }

          before { sign_in host }

          run_test! do
            expect(response).to have_http_status :unprocessable_entity
          end
        end

        response(403, "returns forbidden for emcee role") do
          let(:start_date) { Date.current.beginning_of_month.to_s }
          let(:end_date) { Date.current.to_s }

          before { sign_in emcee }

          run_test! do
            expect(response).to have_http_status :forbidden
          end
        end

        response(401, "returns unauthorized without token") do
          let(:start_date) { Date.current.beginning_of_month.to_s }
          let(:end_date) { Date.current.to_s }

          run_test! do
            expect(response).to have_http_status :unauthorized
          end
        end
      end
    end
  end
end
